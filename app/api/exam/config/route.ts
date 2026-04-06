import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { storage } from "@/lib/storage";
import { getAvailableQuestionsCount, TRACK_SUBJECTS } from "@/lib/exam/questionBank";
import { Subject } from "@/lib/types";

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

const ALL_SUBJECTS: Subject[] = [
  "math", "literature", "english", "physics", 
  "chemistry", "history", "geography", "civic"
];

export async function GET(req: NextRequest) {
  try {
    const uid = await getUidFromRequest(req);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await storage.getStudent(uid);
    if (!student) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ học sinh" }, { status: 404 });
    }

    const grade = (student.grade as number) as 10 | 11 | 12;
    const userTrack = ((student as any).track as "science" | "social" | "mixed") || "science";

    const subjects = ALL_SUBJECTS.map(subject => ({
      id: subject,
      questionCount: getAvailableQuestionsCount(subject, grade),
    }));

    const trackSubjects = TRACK_SUBJECTS[userTrack] || TRACK_SUBJECTS.mixed;

    return NextResponse.json({
      success: true,
      grade,
      track: userTrack,
      subjects,
      trackSubjects,
    });
  } catch (err) {
    console.error("[/api/exam/config]", err);
    return NextResponse.json({ success: false, error: "Lỗi server" }, { status: 400 });
  }
}
