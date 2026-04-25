import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { generateExam, generateSubjectExam } from "@/lib/exam/generator";
import { gradeOne } from "@/lib/exam/grading";
import { ExamResult, Subject, LearningRoadmap } from "@/lib/types";
import openai from "@/lib/openai";
import { buildAnalysisPrompt, buildRoadmapPrompt, generateFallbackRoadmap } from "@/lib/prompts";
import { AnalysisResponse } from "@/lib/types";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getSubjectConfig } from "@/lib/exam/questionBank";

const BodySchema = z.object({
  subject: z.string().optional(),
  mode: z.enum(["track", "full", "single"]),
  track: z.enum(["science", "social", "mixed"]).default("mixed"),
  examName: z.string().min(1).default("Bài kiểm tra đầu vào"),
  answers: z.record(z.string(), z.string()),
});

async function getUidFromRequest(req: NextRequest): Promise<string | null> {
  try {
    const session = req.cookies.get("__session")?.value;
    if (!session) return null;
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

function sumPoints(a: { points: number }[]) {
  return a.reduce((s, x) => s + (Number.isFinite(x.points) ? x.points : 0), 0);
}

export async function POST(req: NextRequest) {
  try {
    const uid = await getUidFromRequest(req);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = BodySchema.parse(await req.json());

    const student = await storage.getStudent(uid);
    if (!student) {
      return NextResponse.json(
        { error: "Không tìm thấy hồ sơ học sinh" },
        { status: 404 },
      );
    }

    let questions;
    let examSubject: Subject = "math";
    let questionType: "mcq" | "short" = "mcq";

    if (body.mode === "single" && body.subject) {
      examSubject = body.subject as Subject;
      const config = getSubjectConfig(examSubject, student.grade as 10 | 11 | 12);
      questionType = "mcq";
      questions = generateSubjectExam({
        grade: student.grade as 10 | 11 | 12,
        subject: examSubject,
        count: config.count,
        type: questionType,
      });
    } else {
      const exam = generateExam({
        grade: student.grade as 10 | 11 | 12,
        mode: body.mode as "track" | "full",
        track: body.track,
        totalQuestions: 10,
        mcqRatio: 0.7,
      });
      questions = exam.questions;
    }

    const graded = questions.map((q) =>
      gradeOne(q, body.answers[q.id] ?? ""),
    );
    const score = sumPoints(graded);
    const maxScore = sumPoints(
      questions.map((q) => ({
        points: q.type === "mcq" ? 1 : (q.rubric?.maxPoints ?? 1),
      })),
    );

    const partial = {
      id: `${uid}-${Date.now()}`,
      studentId: uid,
      subject: examSubject,
      examName: body.examName,
      score,
      maxScore,
      date: new Date().toISOString(),
      answers: graded.map((a) => ({
        questionId: a.questionId,
        question: a.question,
        studentAnswer: a.studentAnswer,
        correctAnswer: a.correctAnswer,
        isCorrect: a.isCorrect,
        topic: a.topic,
        points: a.points,
      })),
      mode: body.mode,
      track: body.track,
    };

    // ── AI analyze — fallback nếu hết quota ──────────────────────
    let analysis: AnalysisResponse = {
      weakTopics: [],
      strongTopics: [],
      feedback: "Không thể phân tích AI lúc này.",
      nextSteps: [],
    };

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: buildAnalysisPrompt(partial) }],
      });
      analysis = JSON.parse(
        completion.choices[0].message.content ?? "{}",
      ) as AnalysisResponse;
    } catch (aiErr: any) {
      console.warn("[/api/submit] AI analyze failed:", aiErr?.error?.code);
      // Tự phân tích không cần AI
      const wrongTopics = [
        ...new Set(graded.filter((a) => !a.isCorrect).map((a) => a.topic as string)),
      ] as string[];
      const rightTopics = [
        ...new Set(graded.filter((a) => a.isCorrect).map((a) => a.topic as string)),
      ] as string[];
      analysis = {
        weakTopics: wrongTopics,
        strongTopics: rightTopics,
        feedback: `Bạn đạt ${Math.round((score / maxScore) * 100)}% số điểm.${wrongTopics.length > 0 ? ` Cần ôn thêm: ${wrongTopics.slice(0, 3).join(", ")}.` : " Làm tốt lắm!"}`,
        nextSteps: wrongTopics
          .slice(0, 3)
          .map((t) => `Ôn tập lại chủ đề: ${t}`),
      };
    }

    const fullResult: ExamResult = {
      ...partial,
      weakTopics: analysis.weakTopics ?? [],
      strongTopics: analysis.strongTopics ?? [],
      aiFeedback: analysis.feedback,
    };

    try {
      await storage.saveExamResult(fullResult);
      console.log("[/api/submit] Result saved successfully:", fullResult.id);
    } catch (saveErr) {
      console.error("[/api/submit] Save result FAILED:", saveErr);
      return NextResponse.json(
        { success: false, error: "Lưu kết quả thất bại: " + String(saveErr) },
        { status: 500 },
      );
    }

    // ── AI roadmap — fallback nếu hết quota ──────────────────────
    let roadmap: LearningRoadmap | null = null;

    try {
      const updatedStudent = await storage.getStudent(uid);
      console.log("[/api/submit] After save, examResults count:", updatedStudent?.examResults?.length);
      if (updatedStudent && updatedStudent.examResults.length >= 2) {
        console.log("[/api/submit] Enough results (>=2), generating roadmap...");
        try {
          const roadmapCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.4,
            response_format: { type: "json_object" },
            messages: [
              { role: "user", content: buildRoadmapPrompt(updatedStudent) },
            ],
          });
          const roadmapData = JSON.parse(
            roadmapCompletion.choices[0].message.content ?? "{}",
          );
          roadmap = {
            ...roadmapData,
            studentId: uid,
            generatedAt: new Date().toISOString(),
          } as LearningRoadmap;
          console.log("[/api/submit] Roadmap generated by AI, saving...");
        } catch (roadmapErr: any) {
          console.warn("[/api/submit] AI roadmap failed:", roadmapErr?.error?.code);
          console.log("[/api/submit] Using fallback roadmap generation...");
          roadmap = generateFallbackRoadmap(updatedStudent);
        }
        
        if (roadmap) {
          await storage.updateRoadmap(uid, roadmap);
          console.log("[/api/submit] Roadmap saved successfully");
        }
      } else {
        console.log("[/api/submit] Not enough results yet:", updatedStudent?.examResults?.length, "/ 2");
      }
    } catch (storageErr) {
      console.warn("[/api/submit] Storage read failed:", storageErr);
    }

    // ── Luôn return response ──────────────────────────────────────
    return NextResponse.json({
      success: true,
      result: fullResult,
      analysis,
      roadmap,
    });
  } catch (err) {
    console.error("[/api/submit]", err);
    return NextResponse.json(
      { success: false, error: "Nộp bài thất bại" },
      { status: 400 },
    );
  }
}
