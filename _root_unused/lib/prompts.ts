import { ExamResult, StudentProfile } from "./types";

// ─── Prompt phân tích bài làm ────────────────────────────────────
export function buildAnalysisPrompt(
  result: Omit<ExamResult, "weakTopics" | "strongTopics" | "aiFeedback">,
): string {
  const wrongAnswers = result.answers.filter((a) => !a.isCorrect);
  const rightAnswers = result.answers.filter((a) => a.isCorrect);

  return `Bạn là giáo viên AI phân tích kết quả bài kiểm tra học sinh Việt Nam.

THÔNG TIN BÀI THI:
- Tên bài: ${result.examName}
- Môn học: ${result.subject}
- Điểm: ${result.score}/${result.maxScore}
- Ngày thi: ${new Date(result.date).toLocaleDateString("vi-VN")}

CÂU TRẢ LỜI SAI (${wrongAnswers.length} câu):
${wrongAnswers
  .map(
    (a, i) => `${i + 1}. Câu hỏi: "${a.question}"
   - Học sinh trả lời: "${a.studentAnswer}"
   - Đáp án đúng: "${a.correctAnswer}"
   - Chủ đề: ${a.topic}`,
  )
  .join("\n\n")}

CÂU TRẢ LỜI ĐÚNG (${rightAnswers.length} câu):
${rightAnswers.map((a) => `- ${a.topic}`).join(", ")}

Hãy phân tích và trả về ĐÚNG JSON sau (không có text nào khác):
{
  "weakTopics": ["chủ đề 1", "chủ đề 2"],
  "strongTopics": ["chủ đề 1"],
  "feedback": "Nhận xét chi tiết 5-6 câu bằng tiếng Việt",
  "nextSteps": ["bước ôn tập 1", "bước ôn tập 2", "bước ôn tập 3"]
}`;
}

// ─── Prompt tạo lộ trình học ─────────────────────────────────────
export function buildRoadmapPrompt(student: StudentProfile): string {
  const results = student.examResults;

  // Tính điểm trung bình
  const avgScore =
    results.reduce((sum, r) => sum + (r.score / r.maxScore) * 10, 0) /
    results.length;

  // Đếm số lần sai theo chủ đề
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
