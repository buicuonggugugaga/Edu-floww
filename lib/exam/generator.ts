import { Subject } from "@/lib/types";
import { QUESTION_BANK, Question, Track, getSubjectsForMode, getAvailableQuestionsCount, TRACK_SUBJECTS } from "./questionBank";

export type ExamMode = "track" | "full" | "subject";

export interface GenerateExamOptions {
  grade: 10 | 11 | 12;
  mode: ExamMode;
  track: Track;
  totalQuestions?: number;
  mcqRatio: number;
}

export interface GeneratedExam {
  examId: string;
  grade: 10 | 11 | 12;
  mode: ExamMode;
  track: Track;
  subjects: Subject[];
  questions: Question[];
  questionCounts: Record<Subject, number>;
  createdAt: string;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.max(0, Math.min(n, a.length)));
}

export function generateExam(opts: GenerateExamOptions): GeneratedExam {
  const subjects = getSubjectsForMode(opts.mode as "track" | "full", opts.track);
  
  const questionCounts: Record<Subject, number> = {} as Record<Subject, number>;
  let allQuestions: Question[] = [];

  for (const subject of subjects) {
    const count = getAvailableQuestionsCount(subject, opts.grade);
    questionCounts[subject] = count;

    const pool = QUESTION_BANK.filter(
      (q) => q.grade === opts.grade && q.subject === subject && q.type === "mcq",
    );
    const picked = pickRandom(pool, count);
    allQuestions = [...allQuestions, ...picked];
  }

  return {
    examId: `exam-${opts.grade}-${opts.mode}-${Date.now()}`,
    grade: opts.grade,
    mode: opts.mode,
    track: opts.track,
    subjects,
    questions: allQuestions,
    questionCounts,
    createdAt: new Date().toISOString(),
  };
}

export interface GenerateSubjectExamOptions {
  grade: 10 | 11 | 12;
  subject: Subject;
  count: number;
  type: "mcq" | "short";
}

export function generateSubjectExam(opts: GenerateSubjectExamOptions): Question[] {
  let pool = QUESTION_BANK.filter(
    (q) => q.grade === opts.grade && q.subject === opts.subject && q.type === opts.type,
  );

  if (pool.length < opts.count) {
    const otherGrades = [10, 11, 12].filter(g => g !== opts.grade);
    for (const grade of otherGrades) {
      const moreQuestions = QUESTION_BANK.filter(
        (q) => q.grade === grade && q.subject === opts.subject && q.type === opts.type,
      );
      pool = [...pool, ...moreQuestions];
      if (pool.length >= opts.count) break;
    }
  }

  if (pool.length === 0) {
    return [];
  }

  const uniquePool = pool.filter((q, index, self) => 
    index === self.findIndex((t) => t.id === q.id)
  );

  return pickRandom(uniquePool, opts.count);
}

export function generateTrackExam(grade: 10 | 11 | 12, track: Track): GeneratedExam {
  const subjects = TRACK_SUBJECTS[track];
  const questionCounts: Record<Subject, number> = {} as Record<Subject, number>;
  let allQuestions: Question[] = [];

  for (const subject of subjects) {
    const count = getAvailableQuestionsCount(subject, grade);
    questionCounts[subject] = count;

    const pool = QUESTION_BANK.filter(
      (q) => q.grade === grade && q.subject === subject && q.type === "mcq",
    );
    const picked = pickRandom(pool, count);
    allQuestions = [...allQuestions, ...picked];
  }

  return {
    examId: `exam-${grade}-${track}-${Date.now()}`,
    grade,
    mode: "track",
    track,
    subjects,
    questions: allQuestions,
    questionCounts,
    createdAt: new Date().toISOString(),
  };
}

