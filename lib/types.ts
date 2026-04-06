export type Subject =
  | "math"
  | "literature"
  | "english"
  | "physics"
  | "chemistry"
  | "history"
  | "geography"
  | "civic";

export type Urgency = "high" | "medium" | "low";

export interface Answer {
  questionId: string;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  topic: string;
  points: number;
  subject?: Subject;
  questionType?: "mcq" | "short";
}

export interface ExamResult {
  id: string;
  studentId: string;
  subject: Subject;
  examName: string;
  score: number;
  maxScore: number;
  date: string;
  answers: Answer[];
  weakTopics: string[];
  strongTopics: string[];
  aiFeedback?: string;
  mode?: "track" | "full" | "single";
  track?: "science" | "social" | "mixed";
}

export interface PriorityTopic {
  topic: string;
  subject: Subject;
  currentLevel: number;
  targetLevel: number;
  urgency: Urgency;
}

export interface WeekPlan {
  week: number;
  focus: string;
  topics: string[];
  targetScore: number;
  resources: string[];
}

export interface LearningRoadmap {
  studentId: string;
  generatedAt: string;
  overallLevel: "beginner" | "intermediate" | "advanced";
  estimatedDays: number;
  weeklyPlan: WeekPlan[];
  priorityTopics: PriorityTopic[];
}

export interface StudentProfile {
  id: string;
  name: string;
  grade: number;
  targetScore: number;
  examResults: ExamResult[];
  roadmap?: LearningRoadmap;
}

export interface AnalysisResponse {
  weakTopics: string[];
  strongTopics: string[];
  feedback: string;
  nextSteps: string[];
}
