import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { getAdminAuth } from "@/lib/firebase/admin";
import openai from "@/lib/openai";
import { z } from "zod";

interface AnswerAnalysis {
  questionId: string;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  topic: string;
  subject: string;
  points: number;
}

interface ExamResult {
  id: string;
  studentId: string;
  subject: string;
  examName: string;
  score: number;
  maxScore: number;
  date: string;
  answers: AnswerAnalysis[];
  weakTopics: string[];
  strongTopics: string[];
}

interface StudentProfile {
  id: string;
  name: string;
  grade: number;
  track: string;
  targetScore: number;
  examResults: ExamResult[];
}

interface TopicAnalysis {
  topic: string;
  subject: string;
  wrongCount: number;
  correctCount: number;
  accuracy: number;
}

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

const BodySchema = z.object({
  student: z.object({
    id: z.string(),
    name: z.string(),
    grade: z.number(),
    track: z.string(),
    targetSchoolScore: z.number().optional(),
    targetUniScore: z.number().optional(),
    examResults: z.array(z.any()).optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const uid = await getUidFromRequest(req);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { student } = BodySchema.parse(await req.json());
    const results = student.examResults || [];

    if (results.length < 2) {
      return NextResponse.json({ error: "Cần ít nhất 2 bài thi" }, { status: 400 });
    }

    // Analyze topics
    const topicMap: Record<string, TopicAnalysis> = {};
    let totalScore = 0;
    let totalMax = 0;

    results.forEach(exam => {
      totalScore += exam.score;
      totalMax += exam.maxScore;
      
      exam.answers?.forEach((answer: AnswerAnalysis) => {
        const key = `${answer.topic}-${answer.subject}`;
        if (!topicMap[key]) {
          topicMap[key] = {
            topic: answer.topic,
            subject: answer.subject,
            wrongCount: 0,
            correctCount: 0,
            accuracy: 0,
          };
        }
        if (answer.isCorrect) {
          topicMap[key].correctCount++;
        } else {
          topicMap[key].wrongCount++;
        }
      });
    });

    // Calculate accuracy
    Object.values(topicMap).forEach(t => {
      const total = t.correctCount + t.wrongCount;
      t.accuracy = total > 0 ? (t.correctCount / total) * 100 : 0;
    });

    const avgScore = totalMax > 0 ? (totalScore / totalMax) * 10 : 0;
    const weakTopics = Object.values(topicMap)
      .filter(t => t.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 8);
    const strongTopics = Object.values(topicMap)
      .filter(t => t.accuracy >= 70)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 4);

    // Determine level
    const level = avgScore >= 8 ? "advanced" : avgScore >= 5.5 ? "intermediate" : "beginner";

    // Generate roadmap
    let roadmap: any = null;
    let aiAnalysis = "";

    try {
      const prompt = `Bạn là chuyên gia tư vấn giáo dục Việt Nam. Phân tích và tạo lộ trình học tập cá nhân hóa.

THÔNG TIN HỌC SINH:
- Tên: ${student.name}
- Lớp: ${student.grade}
- Khối: ${student.track === "science" ? "A/B (Tự nhiên)" : student.track === "social" ? "C/D (Xã hội)" : "Tổng hợp"}
- Điểm TB hiện tại: ${avgScore.toFixed(1)}/10
- Mục tiêu: ${student.targetSchoolScore || 7}/10

CHỦ ĐỀ YẾU CẦN ÔN (${weakTopics.length} chủ đề):
${weakTopics.map(t => `- ${t.topic} (${t.subject}): ${t.accuracy.toFixed(0)}% đúng, sai ${t.wrongCount} câu`).join("\n")}

CHỦ ĐỀ MẠNH:
${strongTopics.map(t => `- ${t.topic} (${t.subject}): ${t.accuracy.toFixed(0)}% đúng`).join("\n")}

YÊU CẦU: Trả về JSON với cấu trúc:
{
  "overallLevel": "beginner|intermediate|advanced",
  "estimatedDays": số_ngày,
  "strengths": ["mảng string các điểm mạnh"],
  "weaknesses": ["mảng string các điểm yếu cần cải thiện"],
  "recommendations": ["mảng string các khuyến nghị cụ thể"],
  "priorityTopics": [{"topic": "tên chủ đề", "subject": "môn học", "currentLevel": số 1-10, "targetLevel": số 1-10, "urgency": "high|medium|low", "exercises": ["bài tập 1", "bài tập 2"]}],
  "weeklyPlan": [{"week": số 1-4, "title": "tiêu đề", "focus": "mô tả", "topics": ["chủ đề 1", "chủ đề 2"], "exercises": [{"type": "loại", "description": "mô tả", "link": "#"}], "targetScore": số, "duration": "mô tả thời gian"}]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      });

      roadmap = JSON.parse(completion.choices[0].message.content || "{}");
      aiAnalysis = "Phân tích bởi AI";
    } catch (aiErr: any) {
      console.warn("[/api/roadmap/generate] AI failed:", aiErr?.error?.code);
      
      // Fallback roadmap without AI
      roadmap = {
        overallLevel: level,
        estimatedDays: 28,
        strengths: strongTopics.map(t => `${t.topic} (${t.subject})`),
        weaknesses: weakTopics.map(t => `${t.topic} (${t.subject}) - ${t.accuracy.toFixed(0)}%`),
        recommendations: [
          "Tập trung ôn các chủ đề có độ chính xác dưới 50%",
          "Luyện tập ít nhất 30 phút mỗi ngày",
          "Giải ít nhất 1 đề thi thử mỗi tuần",
          "Xem lại các bài đã sai và hiểu rõ lỗi sai",
        ],
        priorityTopics: weakTopics.slice(0, 6).map(t => ({
          topic: t.topic,
          subject: t.subject,
          currentLevel: Math.round(t.accuracy / 10),
          targetLevel: 8,
          urgency: t.accuracy < 40 ? "high" : "medium",
          exercises: ["Ôn lại lý thuyết", "Làm bài tập cơ bản", "Giải đề thi"],
        })),
        weeklyPlan: [
          {
            week: 1,
            title: "Nền tảng",
            focus: "Ôn tập kiến thức cơ bản của các chủ đề yếu nhất",
            topics: weakTopics.slice(0, 2).map(t => t.topic),
            exercises: [
              { type: "Lý thuyết", description: "Đọc và hiểu SGK", link: "#" },
              { type: "Bài tập", description: "Làm 10-20 bài cơ bản", link: "#" },
            ],
            targetScore: Math.min(10, avgScore + 0.5),
            duration: "2-3 giờ/ngày",
          },
          {
            week: 2,
            title: "Luyện tập",
            focus: "Nâng cao kỹ năng giải bài tập",
            topics: weakTopics.slice(2, 4).map(t => t.topic),
            exercises: [
              { type: "Luyện tập", description: "Giải bài tập nâng cao", link: "#" },
              { type: "Đề thi", description: "Làm 1-2 đề thử", link: "#" },
            ],
            targetScore: Math.min(10, avgScore + 1),
            duration: "2-3 giờ/ngày",
          },
          {
            week: 3,
            title: "Kiểm tra",
            focus: "Làm đề thi thử và đánh giá",
            topics: weakTopics.slice(0, 4).map(t => t.topic),
            exercises: [
              { type: "Đề thi", description: "Làm full đề 45-60 phút", link: "#" },
              { type: "Chữa bài", description: "Phân tích lỗi sai", link: "#" },
            ],
            targetScore: Math.min(10, avgScore + 1.5),
            duration: "3-4 giờ/ngày",
          },
          {
            week: 4,
            title: "Tổng hợp",
            focus: "Ôn tổng hợp và chuẩn bị",
            topics: [...weakTopics, ...strongTopics].slice(0, 4).map(t => t.topic),
            exercises: [
              { type: "Ôn tổng hợp", description: "Xem lại toàn bộ", link: "#" },
              { type: "Nghỉ ngơi", description: "Không học quá muộn", link: "#" },
            ],
            targetScore: Math.min(10, student.targetSchoolScore || 7),
            duration: "2-3 giờ/ngày",
          },
        ],
      };
      aiAnalysis = "Phân tích tự động (AI quota hết)";
    }

    // Save roadmap
    await storage.updateRoadmap(uid, roadmap);

    return NextResponse.json({
      success: true,
      roadmap,
      analysis: aiAnalysis,
      stats: {
        avgScore: avgScore.toFixed(1),
        totalExams: results.length,
        weakTopics: weakTopics.length,
        strongTopics: strongTopics.length,
      },
    });
  } catch (err) {
    console.error("[/api/roadmap/generate]", err);
    return NextResponse.json({ error: "Lỗi tạo lộ trình" }, { status: 500 });
  }
}
