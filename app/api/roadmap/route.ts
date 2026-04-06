import { NextRequest, NextResponse } from "next/server";
import openai from "@/lib/openai";
import { storage } from "@/lib/storage";
import { buildRoadmapPrompt } from "@/lib/prompts";
import { LearningRoadmap } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { studentId } = await req.json();
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

    if (student.examResults.length < 2) {
      return NextResponse.json(
        { error: "Cần ít nhất 2 bài kiểm tra để tạo lộ trình" },
        { status: 400 },
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: buildRoadmapPrompt(student) }],
    });

    const roadmapData = JSON.parse(completion.choices[0].message.content ?? "{}");

    const roadmap: LearningRoadmap = {
      ...roadmapData,
      studentId,
      generatedAt: new Date().toISOString(),
    };

    await storage.updateRoadmap(studentId, roadmap);

    return NextResponse.json({ success: true, roadmap });
  } catch (err) {
    console.error("[/api/roadmap]", err);
    return NextResponse.json(
      { success: false, error: "Lỗi tạo lộ trình" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "Thiếu studentId" }, { status: 400 });
  }
  const student = await storage.getStudent(studentId);
  return NextResponse.json({ roadmap: student?.roadmap ?? null });
}

