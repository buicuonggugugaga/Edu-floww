import { StudentProfile, LearningRoadmap, Subject, PriorityTopic, WeekPlan } from "./types";

export function buildAnalysisPrompt(result: any): string {
  const wrongAnswers = result.answers.filter((a: any) => !a.isCorrect);
  const rightAnswers = result.answers.filter((a: any) => a.isCorrect);

  return `Bạn là giáo viên AI phân tích kết quả bài kiểm tra học sinh Việt Nam.

THÔNG TIN BÀI THI:
- Tên bài: ${result.examName}
- Môn học: ${result.subject}
- Điểm: ${result.score}/${result.maxScore}
- Ngày thi: ${new Date(result.date).toLocaleDateString("vi-VN")}

CÂU TRẢ LỜI SAI (${wrongAnswers.length} câu):
${wrongAnswers
  .map(
    (a: any, i: number) => `${i + 1}. Câu hỏi: "${a.question}"
   - Học sinh trả lời: "${a.studentAnswer}"
   - Đáp án đúng: "${a.correctAnswer}"
   - Chủ đề: ${a.topic}`,
  )
  .join("\n\n")}

CÂU TRẢ LỜI ĐÚNG (${rightAnswers.length} câu):
${rightAnswers.map((a: any) => `- ${a.topic}`).join(", ")}

Hãy phân tích và trả về ĐÚNG JSON sau (không có text nào khác):
{
  "weakTopics": ["chủ đề 1", "chủ đề 2"],
  "strongTopics": ["chủ đề 1"],
  "feedback": "Nhận xét ngắn gọn 2-3 câu bằng tiếng Việt",
  "nextSteps": ["bước ôn tập 1", "bước ôn tập 2", "bước ôn tập 3"]
}`;
}

export function buildRoadmapPrompt(student: StudentProfile): string {
  const results = student.examResults;

  const avgScore =
    results.reduce((sum, r) => sum + (r.score / r.maxScore) * 10, 0) /
    results.length;

  const weakMap: Record<string, number> = {};
  results.forEach((r) =>
    r.weakTopics.forEach((t) => {
      weakMap[t] = (weakMap[t] ?? 0) + 1;
    }),
  );

  const topWeak = Object.entries(weakMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([topic, count]) => `- ${topic}: sai ${count} lần`)
    .join("\n");

  const recentScores = results
    .slice(-5)
    .map((r) => `${r.examName}: ${r.score}/${r.maxScore}`)
    .join(", ");

  return `Bạn là cố vấn học tập AI. Tạo lộ trình học cá nhân hóa cho học sinh.

THÔNG TIN HỌC SINH:
- Tên: ${student.name}
- Lớp: ${student.grade}
- Điểm trung bình hiện tại: ${avgScore.toFixed(1)}/10
- Mục tiêu điểm: ${student.targetScore}/10
- Số bài đã làm: ${results.length} bài
- Điểm 5 bài gần nhất: ${recentScores}

CHỦ ĐỀ YẾU NHẤT (theo số lần sai):
${topWeak}

Yêu cầu: Tạo lộ trình ${student.targetScore - avgScore > 2 ? "12" : "8"} tuần.

Trả về ĐÚNG JSON sau (không có text nào khác):
{
  "overallLevel": "beginner",
  "estimatedDays": 84,
  "weeklyPlan": [
    {
      "week": 1,
      "focus": "Tên chủ điểm",
      "topics": ["chủ đề 1", "chủ đề 2", "chủ đề 3"],
      "targetScore": 6.5,
      "resources": ["SGK trang X-Y", "Video bài giảng Z"]
    }
  ],
  "priorityTopics": [
    {
      "topic": "Tên chủ đề",
      "subject": "math",
      "currentLevel": 4,
      "targetLevel": 8,
      "urgency": "high"
    }
  ]
}`;
}

export function generateFallbackRoadmap(student: StudentProfile): LearningRoadmap {
  const results = student.examResults;
  
  const avgScore = results.length > 0
    ? results.reduce((sum, r) => sum + (r.score / r.maxScore) * 10, 0) / results.length
    : 0;

  const weakMap: Record<string, { count: number; subject: Subject; score: number }> = {};
  results.forEach((r) => {
    r.answers?.forEach((a) => {
      if (!a.isCorrect) {
        if (!weakMap[a.topic]) {
          weakMap[a.topic] = { count: 0, subject: r.subject, score: 0 };
        }
        weakMap[a.topic].count++;
      }
    });
  });

  const priorityTopics: PriorityTopic[] = Object.entries(weakMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([topic, data]) => ({
      topic,
      subject: data.subject as Subject,
      currentLevel: Math.max(1, Math.round(avgScore / 2)),
      targetLevel: Math.min(10, Math.round(student.targetScore)),
      urgency: data.count >= 2 ? "high" : "medium",
    }));

  const level: "beginner" | "intermediate" | "advanced" = 
    avgScore >= 7 ? "advanced" : avgScore >= 5 ? "intermediate" : "beginner";

  const weekCount = Math.ceil((student.targetScore - avgScore) * 2);
  const weeklyPlan: WeekPlan[] = [];
  
  for (let i = 1; i <= Math.min(weekCount, 8); i++) {
    const targetScore = Math.min(10, avgScore + (i * (student.targetScore - avgScore) / weekCount));
    weeklyPlan.push({
      week: i,
      focus: i <= 2 ? "Ôn tập kiến thức cơ bản" : 
             i <= 5 ? "Luyện tập nâng cao" : "Giải đề thi thử",
      topics: priorityTopics.slice(0, 3).map(p => p.topic),
      targetScore: Math.round(targetScore * 10) / 10,
      resources: ["SGK Toán 12", "Video bài giảng", "Đề thi THPT các năm"],
    });
  }

  return {
    studentId: student.id,
    generatedAt: new Date().toISOString(),
    overallLevel: level,
    estimatedDays: weekCount * 7,
    weeklyPlan,
    priorityTopics,
  };
}
