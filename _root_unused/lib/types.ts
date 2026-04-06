// Tất cả kiểu dữ liệu dùng xuyên suốt project

export type Subject =
  | "math"
  | "literature"
  | "english"
  | "physics"
  | "chemistry";

export type Urgency = "high" | "medium" | "low";

// Một câu trả lời trong bài thi
export interface Answer {
  questionId: string;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  topic: string; // Ví dụ: "Hàm số bậc hai", "Thì hiện tại hoàn thành"
  points: number;
}

// Kết quả một bài thi
export interface ExamResult {
  id: string;
  studentId: string;
  subject: Subject;
  examName: string;
  score: number; // Điểm thực tế, ví dụ 7.5
  maxScore: number; // Thang điểm tối đa, ví dụ 10
  date: string; // ISO string: "2024-03-15T10:30:00Z"
  answers: Answer[];
  weakTopics: string[]; // AI phát hiện — ["Hàm số bậc hai", "Đạo hàm"]
  strongTopics: string[];
  aiFeedback?: string; // Nhận xét tổng quan của AI
}

// Một chủ đề cần ưu tiên học
export interface PriorityTopic {
  topic: string;
  subject: Subject;
  currentLevel: number; // 0–10
  targetLevel: number;
  urgency: Urgency;
}

// Kế hoạch một tuần
export interface WeekPlan {
  week: number;
  focus: string; // Tên chủ điểm tuần này
  topics: string[];
  targetScore: number; // Điểm cần đạt cuối tuần
  resources: string[]; // Tài liệu tham khảo
}

// Lộ trình học do AI tạo
export interface LearningRoadmap {
  studentId: string;
  generatedAt: string;
  overallLevel: "beginner" | "intermediate" | "advanced";
  estimatedDays: number;
  weeklyPlan: WeekPlan[];
  priorityTopics: PriorityTopic[];
}

// Hồ sơ học sinh
export interface StudentProfile {
  id: string;
  name: string;
  grade: number; // 10, 11, 12
  targetScore: number; // Điểm mục tiêu
  examResults: ExamResult[];
  roadmap?: LearningRoadmap;
}

// Response từ AI khi phân tích bài làm
export interface AnalysisResponse {
  weakTopics: string[];
  strongTopics: string[];
  feedback: string;
  nextSteps: string[];
}
