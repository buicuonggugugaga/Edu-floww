import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { generateSubjectExam, generateTrackExam, generateExam } from "@/lib/exam/generator";
import { getAdminAuth } from "@/lib/firebase/admin";
import { Subject } from "@/lib/types";
import { getSubjectConfig, TRACK_SUBJECTS } from "@/lib/exam/questionBank";
import { Track } from "@/lib/exam/questionBank";

const QuerySchema = z.object({
  mode: z.enum(["track", "full", "subject"]).default("full"),
  track: z.enum(["science", "social", "mixed"]).default("mixed"),
  subject: z.string().optional(),
  grade: z.string().optional(),
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

function sanitizeQuestions(questions: any[]) {
  return questions.map((q) => ({
    id: q.id,
    grade: q.grade,
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty,
    type: q.type,
    prompt: q.prompt,
    choices: q.choices ?? null,
  }));
}

export async function GET(req: NextRequest) {
  try {
    const uid = await getUidFromRequest(req);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const parsed = QuerySchema.parse({
      mode: url.searchParams.get("mode") ?? undefined,
      track: url.searchParams.get("track") ?? undefined,
      subject: url.searchParams.get("subject") ?? undefined,
      grade: url.searchParams.get("grade") ?? undefined,
    });

    let grade: 10 | 11 | 12 = 12;
    let track: Track = parsed.track as Track;

    try {
      const student = await storage.getStudent(uid);
      if (student) {
        grade = (student.grade as number) as 10 | 11 | 12;
        track = ((student as any).track as Track) || track;
      }
    } catch (e) {
      // Use default values
    }

    if (parsed.grade) {
      grade = parseInt(parsed.grade) as 10 | 11 | 12;
    }

    let result;

    if (parsed.mode === "subject" && parsed.subject) {
      const subject = parsed.subject as Subject;
      const config = getSubjectConfig(subject, grade);
      const questions = generateSubjectExam({
        grade,
        subject,
        count: config.count,
        type: "mcq",
      });
      result = {
        success: true,
        mode: "subject",
        subject,
        questionCount: config.count,
        questions: sanitizeQuestions(questions),
      };
    } else if (parsed.mode === "track") {
      const exam = generateTrackExam(grade, track);
      result = {
        success: true,
        mode: "track",
        track,
        subjects: TRACK_SUBJECTS[track],
        questionCounts: exam.questionCounts,
        totalQuestions: Object.values(exam.questionCounts).reduce((a, b) => a + b, 0),
        questions: sanitizeQuestions(exam.questions),
      };
    } else {
      const exam = generateExam({
        grade,
        mode: "full",
        track,
        mcqRatio: 1,
      });
      result = {
        success: true,
        mode: "full",
        subjects: exam.subjects,
        questionCounts: exam.questionCounts,
        totalQuestions: Object.values(exam.questionCounts).reduce((a, b) => a + b, 0),
        questions: sanitizeQuestions(exam.questions),
      };
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/exam]", err);
    return NextResponse.json({ success: false, error: "Lỗi server" }, { status: 400 });
  }
}

