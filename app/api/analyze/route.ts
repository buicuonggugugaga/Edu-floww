import { NextRequest, NextResponse } from "next/server";
import openai from "@/lib/openai";
import { storage } from "@/lib/storage";
import { buildAnalysisPrompt } from "@/lib/prompts";
import { AnalysisResponse, ExamResult } from "@/lib/types";
import { z } from "zod";

const AnswerSchema = z.object({
  questionId: z.string(),
  question: z.string(),
  studentAnswer: z.string(),
  correctAnswer: z.string(),
  isCorrect: z.boolean(),
  topic: z.string(),
  points: z.number(),
});

const BodySchema = z.object({
  studentId: z.string(),
  subject: z.enum(["math", "literature", "english", "physics", "chemistry"]),
  examName: z.string(),
  score: z.number().min(0),
  maxScore: z.number().min(1),
  answers: z.array(AnswerSchema),
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());

    const partialResult: Omit<
      ExamResult,
      "weakTopics" | "strongTopics" | "aiFeedback"
    > = {
      id: `${body.studentId}-${Date.now()}`,
      date: new Date().toISOString(),
      ...body,
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: buildAnalysisPrompt(partialResult) }],
    });

    const analysis = JSON.parse(
      completion.choices[0].message.content ?? "{}",
    ) as AnalysisResponse;

    const fullResult: ExamResult = {
      ...partialResult,
      weakTopics: analysis.weakTopics ?? [],
      strongTopics: analysis.strongTopics ?? [],
      aiFeedback: analysis.feedback,
    };

    await storage.saveExamResult(fullResult);

    return NextResponse.json({
      success: true,
      result: fullResult,
      analysis,
    });
  } catch (err) {
    console.error("[/api/analyze]", err);
    return NextResponse.json(
      { success: false, error: "Lỗi phân tích bài thi" },
      { status: 500 },
    );
  }
}

