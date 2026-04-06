import { Question } from "./questionBank";

export interface GradedAnswer {
  questionId: string;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  topic: string;
  points: number;
  subject: string;
  questionType: "mcq" | "short";
}

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”"]/g, '"')
    .replace(/[’‘]/g, "'");
}

export function gradeOne(question: Question, studentAnswerRaw: string): GradedAnswer {
  const studentAnswer = studentAnswerRaw ?? "";

  if (question.type === "mcq") {
    const ok = normalize(studentAnswer) === normalize(question.answerKey);
    return {
      questionId: question.id,
      question: question.prompt,
      studentAnswer,
      correctAnswer: question.answerKey,
      isCorrect: ok,
      topic: question.topic,
      points: ok ? 1 : 0,
      subject: question.subject,
      questionType: "mcq",
    };
  }

  const rubric = question.rubric ?? { maxPoints: 1, keywords: [], variants: [] };
  const maxPoints = rubric.maxPoints ?? 1;
  const studentN = normalize(studentAnswer);
  const keyN = normalize(question.answerKey);
  const variantsN = [keyN, ...(rubric.variants ?? []).map(normalize)];
  const keywordsN = (rubric.keywords ?? []).map(normalize).filter(Boolean);

  const exactMatch = variantsN.some((v) => v && studentN === v);
  const keywordHit =
    keywordsN.length > 0 ? keywordsN.some((k) => k && studentN.includes(k)) : false;

  // Simple rubric: full points if exact OR keyword hit; else 0.
  const ok = exactMatch || keywordHit;
  return {
    questionId: question.id,
    question: question.prompt,
    studentAnswer,
    correctAnswer: question.answerKey,
    isCorrect: ok,
    topic: question.topic,
    points: ok ? maxPoints : 0,
    subject: question.subject,
    questionType: "short",
  };
}

