import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "Thiếu studentId" }, { status: 400 });
  }
  const student = await storage.getStudent(studentId);
  if (!student) {
    return NextResponse.json(
      { error: "Không tìm thấy học sinh" },
      { status: 404 },
    );
  }
  return NextResponse.json({
    student: {
      id: student.id,
      name: student.name,
      grade: student.grade,
      targetScore: student.targetScore,
    },
    examResults: student.examResults,
  });
}

