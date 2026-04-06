import { z } from "zod";
import { Subject } from "@/lib/types";

export type Track = "science" | "social" | "mixed";
export type QuestionType = "mcq" | "short";

export const QuestionSchema = z.object({
  id: z.string(),
  grade: z.union([z.literal(10), z.literal(11), z.literal(12)]),
  subject: z.custom<Subject>(),
  topic: z.string(),
  difficulty: z.union([z.literal("easy"), z.literal("medium"), z.literal("hard")]),
  type: z.union([z.literal("mcq"), z.literal("short")]),
  prompt: z.string(),
  choices: z.array(z.string()).optional(),
  answerKey: z.string(),
  rubric: z.object({
    maxPoints: z.number().min(0.5),
    keywords: z.array(z.string()).default([]),
    variants: z.array(z.string()).default([]),
  }).optional(),
  track: z.union([z.literal("science"), z.literal("social"), z.literal("mixed")]),
});

export type Question = z.infer<typeof QuestionSchema>;

function q(id: string, grade: 10 | 11 | 12, subject: Subject, topic: string, prompt: string, choices: string[], answer: string, diff: "easy" | "medium" | "hard" = "medium", track: Track = "mixed"): Question {
  return { id, grade, subject, topic, difficulty: diff, type: "mcq", prompt, choices, answerKey: answer, track };
}

function essay(id: string, grade: 10 | 11 | 12, topic: string, prompt: string, answer: string, keywords: string[]): Question {
  return { id, grade, subject: "literature", topic, difficulty: "hard", type: "short", prompt, answerKey: answer, rubric: { maxPoints: 10, keywords, variants: [] }, track: "social" };
}

export const QUESTION_BANK: Question[] = [
  // ==================== TOÁN (50+ câu/môn) ====================
  // Lớp 10
  ...[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map((i, idx) => {
    const topics = ["Mệnh đề và tập hợp", "Hàm số bậc nhất", "Bất phương trình", "Tổ hợp xác suất", "Hình học"];
    const questions = [
      { p: `Tập hợp các số nguyên từ 1 đến 5 có bao nhiêu phần tử?`, c: ["4", "5", "6", "7"], a: "5" },
      { p: `Biểu diễn miền giá trị |x| < 3 là?`, c: ["(-3, 3)", "[-3, 3]", "(-∞, -3) ∪ (3, +∞)", "[-∞, -3] ∪ [3, +∞]"], a: "(-3, 3)" },
      { p: `Hàm số y = -2x + 4 có tọa độ giao điểm với trục Oy?`, c: ["(0, 4)", "(0, -4)", "(4, 0)", "(0, 2)"], a: "(0, 4)" },
      { p: `Giá trị của 5! (5 giai thừa) bằng?`, c: ["60", "120", "25", "720"], a: "120" },
      { p: `Diện tích hình tam giác có đáy 6cm, chiều cao 4cm là?`, c: ["12 cm²", "24 cm²", "10 cm²", "14 cm²"], a: "12 cm²" },
      { p: `Nghiệm của phương trình 2x + 6 = 0 là?`, c: ["x = 3", "x = -3", "x = 6", "x = -6"], a: "x = -3" },
      { p: `Hàm số nào đồng biến trên R?`, c: ["y = -x", "y = x²", "y = 3x - 1", "y = 1/x"], a: "y = 3x - 1" },
      { p: `5C2 bằng bao nhiêu?`, c: ["5", "10", "15", "20"], a: "10" },
      { p: `Hình tròn có bán kính 3cm, chu vi bằng?`, c: ["6π cm", "9π cm", "3π cm", "12π cm"], a: "6π cm" },
      { p: `Phủ định của ∀x ∈ R: x ≥ 0 là gì?`, c: ["∃x ∈ R: x < 0", "∀x ∈ R: x < 0", "∃x ∈ R: x ≤ 0", "∀x ∈ R: x ≤ 0"], a: "∃x ∈ R: x < 0" },
      { p: `Giá trị của log₂16 bằng?`, c: ["2", "4", "8", "16"], a: "4" },
      { p: `Hàm số y = x² có điểm cực tiểu tại?`, c: ["x = 0", "x = 1", "x = -1", "Không có"], a: "x = 0" },
      { p: `Số hợp từ 5 người chọn 3 người là?`, c: ["10", "15", "20", "60"], a: "10" },
      { p: `Độ dài cung tròn bán kính 2, góc 90° là?`, c: ["π", "2π", "4π", "π/2"], a: "π" },
      { p: `Giải hệ: x + y = 5, x - y = 1`, c: ["x=3, y=2", "x=2, y=3", "x=4, y=1", "x=1, y=4"], a: "x=3, y=2" },
      { p: `Hình thang có đáy lớn 8, đáy bé 4, chiều cao 5. Diện tích?`, c: ["30", "40", "20", "25"], a: "30" },
      { p: `Tổng vô hạn级 số 1 + 1/2 + 1/4 + ... = ?`, c: ["1", "2", "1.5", "∞"], a: "2" },
      { p: `Phương trình x² - 5x + 6 = 0 có nghiệm?`, c: ["x=2, x=3", "x=1, x=6", "x=-2, x=-3", "x=5, x=6"], a: "x=2, x=3" },
      { p: `Tangent của góc 45° bằng?`, c: ["1", "√2", "√3/3", "0"], a: "1" },
      { p: `Số phức conjugate của 3 + 4i là?`, c: ["3 - 4i", "-3 + 4i", "3 + 4i", "-3 - 4i"], a: "3 - 4i" },
    ];
    const t = topics[idx % topics.length];
    const qu = questions[idx % questions.length];
    return q(`math-10-${String(idx+1).padStart(3,'0')}`, 10, "math", t, qu.p, qu.c, qu.a);
  }),
  
  // Lớp 11 (20 câu)
  ...[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map((i, idx) => {
    const topics = ["Lũy thừa - Mũ", "Logarit", "Tích phân", "Xác suất", "Hàm số"];
    const questions = [
      { p: `2⁴ bằng bao nhiêu?`, c: ["8", "16", "32", "64"], a: "16" },
      { p: `log₁₀100 bằng?`, c: ["1", "2", "10", "100"], a: "2" },
      { p: `∫x dx = ?`, c: ["x² + C", "x²/2 + C", "1 + C", "2x + C"], a: "x²/2 + C" },
      { p: `Đạo hàm của f(x) = 3x² + 2x là?`, c: ["6x + 2", "3x + 2", "6x", "9x²"], a: "6x + 2" },
      { p: `Tung 2 xúc xắc, tổng 2 mặt bằng 7 có bao nhiêu cách?`, c: ["5", "6", "7", "36"], a: "6" },
      { p: `Giá trị của e^0 bằng?`, c: ["0", "1", "e", "∞"], a: "1" },
      { p: `log₃9 = ?`, c: ["2", "3", "9", "1"], a: "2" },
      { p: `∫(3x² + 2)dx = ?`, c: ["x³ + 2x + C", "3x³ + 2x + C", "x³ + 2 + C", "6x + C"], a: "x³ + 2x + C" },
      { p: `Đạo hàm của sin(x) là?`, c: ["cos(x)", "-sin(x)", "-cos(x)", "tan(x)"], a: "cos(x)" },
      { p: `Xác suất chọn được số chẵn từ {1,2,3,4,5,6}?`, c: ["1/2", "1/3", "1/6", "2/3"], a: "1/2" },
      { p: `5! = ?`, c: ["60", "120", "25", "720"], a: "120" },
      { p: `Giải phương trình e^x = 1`, c: ["x = 0", "x = 1", "x = e", "Không nghiệm"], a: "x = 0" },
      { p: `∫cos(x)dx = ?`, c: ["sin(x) + C", "-sin(x) + C", "cos(x) + C", "-cos(x) + C"], a: "sin(x) + C" },
      { p: `Biến thiên hàm y = x³ - 3x có mấy cực trị?`, c: ["1", "2", "3", "0"], a: "2" },
      { p: `log₂(1/8) = ?`, c: ["-3", "3", "-4", "8"], a: "-3" },
      { p: `∫(1/x)dx = ?`, c: ["ln|x| + C", "1/x² + C", "x + C", "ln(x²) + C"], a: "ln|x| + C" },
      { p: `Xác suất tung 3 đồng xu ra 3 mặt ngửa?`, c: ["1/8", "1/4", "1/2", "1/6"], a: "1/8" },
      { p: `Giá trị đạo hàm f(x) = x³ tại x=2?`, c: ["6", "8", "12", "4"], a: "12" },
      { p: `Hàm số nào nghịch biến trên R?`, c: ["y = -2x + 1", "y = x²", "y = 1/x", "y = |x|"], a: "y = -2x + 1" },
      { p: `8P3 = ?`, c: ["336", "120", "56", "8"], a: "336" },
    ];
    const t = topics[idx % topics.length];
    const qu = questions[idx % questions.length];
    return q(`math-11-${String(idx+1).padStart(3,'0')}`, 11, "math", t, qu.p, qu.c, qu.a);
  }),

  // Lớp 12 (20 câu)
  ...[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map((i, idx) => {
    const topics = ["Số phức", "Tích phân", "Xác suất", "Hình học", "Lũy thừa"];
    const questions = [
      { p: `|5 + 12i| = ?`, c: ["13", "17", "7", "144"], a: "13" },
      { p: `∫₀¹ x² dx = ?`, c: ["1/3", "1/2", "1", "2/3"], a: "1/3" },
      { p: `Xác suất chọn được 2女孩 từ 3 trai, 2 gái?`, c: ["1/10", "1/5", "1/2", "3/10"], a: "1/10" },
      { p: `Phương trình đường tròn tâm (0,0), R=5 là?`, c: ["x² + y² = 25", "x² + y² = 5", "(x-5)² + y² = 0", "x + y = 25"], a: "x² + y² = 25" },
      { p: `(1+i)² = ?`, c: ["2i", "2", "1+i", "2+2i"], a: "2i" },
      { p: `∫e^x dx = ?`, c: ["e^x + C", "xe^x + C", "e^(x+1) + C", "ln(x) + C"], a: "e^x + C" },
      { p: `Xác suất xúc xắc ra số > 4?`, c: ["1/3", "1/2", "1/6", "2/3"], a: "1/3" },
      { p: `Tâm đường tròn (x-3)² + (y+2)² = 16 là?`, c: ["(3, -2)", "(-3, 2)", "(3, 2)", "(-3, -2)"], a: "(3, -2)" },
      { p: `Đạo hàm của ln(x) là?`, c: ["1/x", "ln(x)", "x", "1/x²"], a: "1/x" },
      { p: `Hàm số y = -x² + 4x có cực đại tại x = ?`, c: ["2", "4", "-2", "0"], a: "2" },
      { p: `5³ = ?`, c: ["15", "25", "125", "250"], a: "125" },
      { p: `∫(4x³ + 2x)dx = ?`, c: ["x⁴ + x² + C", "4x⁴ + x² + C", "x⁴ + 2x² + C", "12x² + 2 + C"], a: "x⁴ + x² + C" },
      { p: `Số arrangements của 4 đối tượng là?`, c: ["24", "12", "4", "1"], a: "24" },
      { p: `Tâm đoạn thẳng AB với A(1,2), B(5,6) là?`, c: ["(3, 4)", "(4, 3)", "(2, 3)", "(3, 8)"], a: "(3, 4)" },
      { p: `Giá trị lớn nhất của y = -(x-2)² + 5 là?`, c: ["5", "2", "7", "0"], a: "5" },
      { p: `log₁₀0.01 = ?`, c: ["-2", "-1", "2", "0.01"], a: "-2" },
      { p: `∫(6x² - 4x + 1)dx = ?`, c: ["2x³ - 2x² + x + C", "6x³ - 4x² + x + C", "2x³ - 2x² + C", "3x² - 4x + C"], a: "2x³ - 2x² + x + C" },
      { p: `Phương trình |x - 1| = 3 có mấy nghiệm?`, c: ["2", "1", "0", "3"], a: "2" },
      { p: `Diện tích tam giác A(0,0), B(4,0), C(0,3) là?`, c: ["6", "12", "7", "24"], a: "6" },
      { p: `10C3 = ?`, c: ["120", "720", "30", "1000"], a: "120" },
    ];
    const t = topics[idx % topics.length];
    const qu = questions[idx % questions.length];
    return q(`math-12-${String(idx+1).padStart(3,'0')}`, 12, "math", t, qu.p, qu.c, qu.a);
  }),

  // ==================== TIẾNG ANH (50 câu/môn) ====================
  ...Array.from({length: 50}, (_, idx) => {
    const grade = idx < 20 ? 10 as const : idx < 35 ? 11 as const : 12 as const;
    const questions = [
      { p: `She ____ to school every day.`, c: ["go", "goes", "going", "went"], a: "goes" },
      { p: `They ____ TV last night.`, c: ["watch", "watches", "watched", "watching"], a: "watched" },
      { p: `There ____ 3 apples on the table.`, c: ["is", "are", "was", "be"], a: "are" },
      { p: `What is the opposite of 'happy'?`, c: ["sad", "angry", "tired", "excited"], a: "sad" },
      { p: `She is ____ than her sister.`, c: ["taller", "tallest", "more tall", "most tall"], a: "taller" },
      { p: `I ____ English for 3 years.`, c: ["study", "studied", "have studied", "studying"], a: "have studied" },
      { p: `If I ____ rich, I would travel.`, c: ["am", "was", "were", "be"], a: "were" },
      { p: `This is the book ____ I bought.`, c: ["which", "who", "whom", "whose"], a: "which" },
      { p: `The meeting ____ at 9 AM tomorrow.`, c: ["starts", "started", "will start", "starting"], a: "will start" },
      { p: `He is interested ____ science.`, c: ["in", "on", "at", "for"], a: "in" },
      { p: `I used to ____ up early.`, c: ["wake", "waking", "woke", "waken"], a: "wake" },
      { p: `She enjoys ____ books.`, c: ["reading", "read", "to read", "reads"], a: "reading" },
      { p: `The car is ____ than the motorcycle.`, c: ["faster", "fastest", "fast", "more fast"], a: "faster" },
      { p: `We ____ to the cinema yesterday.`, c: ["go", "went", "gone", "going"], a: "went" },
      { p: `He suggested ____ to the park.`, c: ["going", "go", "to go", "gone"], a: "going" },
      { p: `If it ____, we'll stay home.`, c: ["rains", "will rain", "rained", "rain"], a: "rains" },
      { p: `She has lived here ____ 2020.`, c: ["since", "for", "in", "at"], a: "since" },
      { p: `Neither John ____ Mary came.`, c: ["nor", "or", "and", "but"], a: "nor" },
      { p: `The news ____ good today.`, c: ["is", "are", "were", "been"], a: "is" },
      { p: `I look forward ____ you.`, c: ["to seeing", "seeing", "to see", "see"], a: "to seeing" },
    ];
    const qItem = questions[idx % questions.length];
    return q(`eng-${grade}-${String(idx%20+1).padStart(3,'0')}`, grade, "english", "Grammar/Vocabulary", qItem.p, qItem.c, qItem.a);
  }),

  // ==================== VẬT LÝ (40 câu/môn) ====================
  ...Array.from({length: 40}, (_, idx) => {
    const grade = idx < 15 ? 10 as const : idx < 28 ? 11 as const : 12 as const;
    const questions = [
      { p: `Đơn vị của lực là?`, c: ["N", "kg", "m/s", "J"], a: "N" },
      { p: `Công thức tính vận tốc?`, c: ["v = s/t", "v = m*t", "v = F/m", "v = a*t"], a: "v = s/t" },
      { p: `Gia tốc trọng trường?`, c: ["9.8 m/s²", "8.9 m/s²", "10.8 m/s²", "7.8 m/s²"], a: "9.8 m/s²" },
      { p: `Đơn vị của năng lượng?`, c: ["J", "W", "N", "Pa"], a: "J" },
      { p: `Công suất P = ?`, c: ["W/t", "F/s", "m*v", "E*t"], a: "W/t" },
      { p: `Tốc độ ánh sáng?`, c: ["3×10⁸ m/s", "3×10⁶ m/s", "3×10¹⁰ m/s", "3×10⁵ m/s"], a: "3×10⁸ m/s" },
      { p: `Công thức lực đàn hồi?`, c: ["F = -kx", "F = kx", "F = mg", "F = ma"], a: "F = -kx" },
      { p: `Định luật II Newton?`, c: ["F = ma", "F = mv", "E = mc²", "P = mv"], a: "F = ma" },
      { p: `Đơn vị của điện trở?`, c: ["Ω", "A", "V", "W"], a: "Ω" },
      { p: `Công suất điện P = ?`, c: ["UI", "U/I", "U*I²", "U²*I"], a: "UI" },
      { p: `Tốc độ âm thanh trong không khí?`, c: ["340 m/s", "300 m/s", "400 m/s", "3×10⁸ m/s"], a: "340 m/s" },
      { p: `Công thức động lượng?`, c: ["p = mv", "p = ma", "p = m/v", "p = F*t"], a: "p = mv" },
      { p: `Định luật I Newton?`, c: ["Vạn vật giữ nguyên trạng thái", "F = ma", "Phản lực", "E = mc²"], a: "Vạn vật giữ nguyên trạng thái" },
      { p: `Tần số f = ?`, c: ["1/T", "T", "T²", "2T"], a: "1/T" },
      { p: `Điện dung C = ?`, c: ["Q/U", "U/Q", "I/R", "P*t"], a: "Q/U" },
      { p: `Công thức nhiệt lượng?`, c: ["Q = mcΔt", "Q = m/t", "Q = Pt", "Q = F*s"], a: "Q = mcΔt" },
      { p: `Độ tụy quang?`, c: ["1/f = 1/a + 1/b", "f = 1/a", "a = b", "P = 1/f"], a: "1/f = 1/a + 1/b" },
      { p: `Công thức tốc độ sóng?`, c: ["v = λf", "v = f/λ", "v = λ/f", "v = λ+f"], a: "v = λf" },
      { p: `Đơn vị của cảm ứng từ?`, c: ["T", "H", "Wb", "A/m"], a: "T" },
      { p: `Hiệu điện thế U = ?`, c: ["I*R", "I/R", "R/I", "I+R"], a: "I*R" },
    ];
    const qItem = questions[idx % questions.length];
    const topics = ["Cơ học", "Nhiệt học", "Điện học", "Quang học", "Sóng"];
    return q(`phy-${grade}-${String(idx%20+1).padStart(3,'0')}`, grade, "physics", topics[idx % topics.length], qItem.p, qItem.c, qItem.a);
  }),

  // ==================== HÓA HỌC (40 câu/môn) ====================
  ...Array.from({length: 40}, (_, idx) => {
    const grade = idx < 15 ? 10 as const : idx < 28 ? 11 as const : 12 as const;
    const questions = [
      { p: `Số hiệu nguyên tử của Oxi?`, c: ["6", "7", "8", "9"], a: "8" },
      { p: `Công thức hóa học của nước?`, c: ["H₂O", "CO₂", "O₂", "H₂O₂"], a: "H₂O" },
      { p: `Cùng nhóm Periodic có gì giống nhau?`, c: ["Số e- ngoài cùng", "Số lớp e-", "Khối lượng", "Số neutron"], a: "Số e- ngoài cùng" },
      { p: `Phản ứng trung hòa là phản ứng giữa?`, c: ["Axit + Bazơ", "Axit + Axit", "Bazơ + Bazơ", "Muối + Nước"], a: "Axit + Bazơ" },
      { p: `Công thức tính số mol?`, c: ["n = m/M", "n = M/m", "n = V*m", "n = m*V"], a: "n = m/M" },
      { p: `Khí nào là khí nhà kính?`, c: ["CO₂", "O₂", "N₂", "H₂"], a: "CO₂" },
      { p: `Kim loại dẫn điện tốt nhất?`, c: ["Bạc", "Đồng", "Vàng", "Sắt"], a: "Bạc" },
      { p: `pH của dung dịch trung tính?`, c: ["7", "0", "14", "1"], a: "7" },
      { p: `Cấu hình electron của Na (Z=11)?`, c: ["2-8-1", "2-8-2", "2-7-2", "2-9"], a: "2-8-1" },
      { p: `Loại liên kết trong NaCl?`, c: ["Ion", "Covalent", "Kim loại", "Hydro"], a: "Ion" },
      { p: `Oxi hóa là quá trình?`, c: ["Mất e-", "Nhận e-", "Giữ nguyên", "Trao đổi"], a: "Mất e-" },
      { p: `Phản ứng hóa học khác vật lý ở điểm?`, c: ["Tạo chất mới", "Thay đổi trạng thái", "Thay đổi hình dạng", "Không có"], a: "Tạo chất mới" },
      { p: `Nguyên tử có Z=6 là nguyên tố gì?`, c: ["Cacbon", "Nito", "Oxi", "Natri"], a: "Cacbon" },
      { p: `Khối lượng mol của O₂?`, c: ["32 g/mol", "16 g/mol", "2 g/mol", "8 g/mol"], a: "32 g/mol" },
      { p: `Tinh thể muối ăn có loại liên kết?`, c: ["Ion", "Covalent", "Kim loại", "Phân tử"], a: "Ion" },
      { p: `Độ pH của dung dịch NaOH 1M?`, c: ["14", "7", "0", "1"], a: "14" },
      { p: `Công thức hóa học của Axit clohydric?`, c: ["HCl", "H₂SO₄", "HNO₃", "CH₃COOH"], a: "HCl" },
      { p: `Phản ứng nào là phản ứng oxi hóa?`, c: ["Fe → Fe²⁺ + 2e⁻", "Cu²⁺ + 2e⁻ → Cu", "2H⁺ + 2e⁻ → H₂", "Ag⁺ + e⁻ → Ag"], a: "Fe → Fe²⁺ + 2e⁻" },
      { p: `Số electron trong nguyên tử Clo (Z=17)?`, c: ["17", "18", "16", "7"], a: "17" },
      { p: `Loại polymer PP có monome là?`, c: ["Propylene", "Ethylene", "Styrene", "Vinyl"], a: "Propylene" },
    ];
    const qItem = questions[idx % questions.length];
    const topics = ["Nguyên tử", "Liên kết", "Phản ứng", "Cân bằng", "Organic"];
    return q(`chem-${grade}-${String(idx%20+1).padStart(3,'0')}`, grade, "chemistry", topics[idx % topics.length], qItem.p, qItem.c, qItem.a);
  }),

  // ==================== LỊCH SỬ (40 câu/môn) ====================
  ...Array.from({length: 40}, (_, idx) => {
    const grade = idx < 15 ? 10 as const : idx < 28 ? 11 as const : 12 as const;
    const questions = [
      { p: `Năm Việt Nam độc lập?`, c: ["1945", "1954", "1975", "1930"], a: "1945" },
      { p: `Chiến thắng Điện Biên Phủ năm?`, c: ["1950", "1954", "1968", "1975"], a: "1954" },
      { p: `Cách mạng Pháp bắt đầu năm?`, c: ["1776", "1789", "1848", "1917"], a: "1789" },
      { p: `Chủ tịch nước đầu tiên của VN?`, c: ["Hồ Chí Minh", "Lê Duẩn", "Phạm Văn Đồng", "Trường Chinh"], a: "Hồ Chí Minh" },
      { p: `Đảng CSVN thành lập năm?`, c: ["1920", "1930", "1940", "1945"], a: "1930" },
      { p: `Chiến tranh thế giới 2 kết thúc?`, c: ["1943", "1944", "1945", "1946"], a: "1945" },
      { p: `Hiệp định Paris ký năm?`, c: ["1971", "1972", "1973", "1974"], a: "1973" },
      { p: `Tổng tấn công Tết Mậu Thân năm?`, c: ["1967", "1968", "1969", "1970"], a: "1968" },
      { p: `Năm reunification Việt Nam?`, c: ["1974", "1975", "1976", "1977"], a: "1975" },
      { p: `Liên bang Xô Viết tan rã năm?`, c: ["1989", "1990", "1991", "1992"], a: "1991" },
      { p: `Cách mạng Tháng Tám năm?`, c: ["1944", "1945", "1946", "1950"], a: "1945" },
      { p: `Chiến dịch Hồ Chí Minh năm?`, c: ["1974", "1975", "1976", "1970"], a: "1975" },
      { p: `Năm Việt Nam gia nhập ASEAN?`, c: ["1993", "1994", "1995", "1996"], a: "1995" },
      { p: `Năm Việt Nam gia nhập WTO?`, c: ["2005", "2006", "2007", "2008"], a: "2007" },
      { p: `Chiến tranh thế giới 1 bắt đầu năm?`, c: ["1912", "1914", "1916", "1918"], a: "1914" },
      { p: `Cách mạng tháng 10 Nga năm?`, c: ["1915", "1916", "1917", "1918"], a: "1917" },
      { p: `Phong trào Đông Du do ai khởi xướng?`, c: ["Phan Bội Châu", "Phan Châu Trinh", "Hồ Chí Minh", "Nguyễn Ái Quốc"], a: "Phan Bội Châu" },
      { p: `Năm thành lập nước Việt Nam Dân chủ Cộng hòa?`, c: ["1944", "1945", "1946", "1947"], a: "1945" },
      { p: `Hiềnaddock Genève năm?`, c: ["1953", "1954", "1955", "1956"], a: "1954" },
      { p: `Đại hội Đảng lần thứ VI năm?`, c: ["1984", "1985", "1986", "1987"], a: "1986" },
    ];
    const qItem = questions[idx % questions.length];
    const topics = ["Lịch sử VN", "Lịch sử thế giới", "Cách mạng", "Đại hội", "Chiến tranh"];
    return q(`hist-${grade}-${String(idx%20+1).padStart(3,'0')}`, grade, "history", topics[idx % topics.length], qItem.p, qItem.c, qItem.a);
  }),

  // ==================== ĐỊA LÝ (40 câu/môn) ====================
  ...Array.from({length: 40}, (_, idx) => {
    const grade = idx < 15 ? 10 as const : idx < 28 ? 11 as const : 12 as const;
    const questions = [
      { p: `Diện tích Việt Nam?`, c: ["331 nghìn km²", "312 nghìn km²", "350 nghìn km²", "400 nghìn km²"], a: "331 nghìn km²" },
      { p: `Đỉnh núi cao nhất VN?`, c: ["Fansipan", "Pu Si Lung", "Pu Ta Leng", "Ba Den"], a: "Fansipan" },
      { p: `Đại dương lớn nhất thế giới?`, c: ["Thái Bình Dương", "Đại Tây Dương", "Ấn Độ Dương", "Băng Dương"], a: "Thái Bình Dương" },
      { p: `Thủ đô Việt Nam?`, c: ["Hà Nội", "TP.HCM", "Đà Nẵng", "Hải Phòng"], a: "Hà Nội" },
      { p: `Sông nào dài nhất VN?`, c: ["Sông Cửu Long", "Sông Hồng", "Sông Mã", "Sông Bé"], a: "Sông Cửu Long" },
      { p: `Khí hậu VN thuộc loại?`, c: ["Nhiệt đới", "Á ôn đới", "Xavan", "Địa Trung Hải"], a: "Nhiệt đới" },
      { p: `Châu nào lớn nhất thế giới?`, c: ["Châu Á", "Châu Phi", "Châu Âu", "Châu Mỹ"], a: "Châu Á" },
      { p: `Vùng kinh tế nào phát triển nhất VN?`, c: ["Đông Nam Bộ", "Đồng bằng Sông Hồng", "Đồng bằng Sông Cửu Long", "Trung Bộ"], a: "Đông Nam Bộ" },
      { p: `Vịnh nào đẹp nhất VN?`, c: ["Vịnh Hạ Long", "Vịnh Nha Trang", "Vịnh Phú Quốc", "Vịnh Lan Hạ"], a: "Vịnh Hạ Long" },
      { p: `Tỉnh nào lớn nhất VN về diện tích?`, c: ["Thanh Hóa", "Nghệ An", "Gia Lai", "Lâm Đồng"], a: "Gia Lai" },
      { p: `Đảo lớn nhất VN?`, c: ["Phú Quốc", "Cát Bà", "Côn Đảo", "Lý Sơn"], a: "Phú Quốc" },
      { p: `Sông Hồng còn gọi là gì?`, c: ["Sông Thượng Long", "Sông Hồng", "Sông Cái", "Sông Nhị"], a: "Sông Thượng Long" },
      { p: `Đô thị lớn nhất VN?`, c: ["TP.HCM", "Hà Nội", "Đà Nẵng", "Cần Thơ"], a: "TP.HCM" },
      { p: `Đồng bằng lớn nhất VN?`, c: ["ĐBSCL", "ĐBSH", "Đồng bằng Nghệ An", "Đồng bằng duyên hải"], a: "ĐBSCL" },
      { p: `Núi cao nhất Đông Nam Á?`, c: ["Kinabalu", "Fansipan", "Ri", "Jaya"], a: "Kinabalu" },
      { p: `Thềm lục địa VN trải rộng bao nhiêu hải lý?`, c: ["200", "150", "100", "50"], a: "200" },
      { p: `Tài nguyên khoáng sản lớn nhất VN?`, c: ["Than đá", "Dầu khí", "Bauxit", "Sắt"], a: "Than đá" },
      { p: `Múi giờ VN là UTC+?`, c: ["7", "6", "8", "5"], a: "7" },
      { p: `Biển nào giáp VN phía đông?`, c: ["Biển Đông", "Biển Nhật Bản", "Biển Andaman", "Biển Sulu"], a: "Biển Đông" },
      { p: `Cao nguyên lớn nhất VN?`, c: ["Tây Nguyên", "Cao nguyên Đồng Văn", "Cao nguyên Mộc Châu", "Cao nguyên Hà Giang"], a: "Tây Nguyên" },
    ];
    const qItem = questions[idx % questions.length];
    const topics = ["Địa lý VN", "Địa lý thế giới", "Tự nhiên", "Kinh tế", "Dân cư"];
    return q(`geo-${grade}-${String(idx%20+1).padStart(3,'0')}`, grade, "geography", topics[idx % topics.length], qItem.p, qItem.c, qItem.a);
  }),

  // ==================== GDCD (40 câu/môn) ====================
  ...Array.from({length: 40}, (_, idx) => {
    const grade = idx < 15 ? 10 as const : idx < 28 ? 11 as const : 12 as const;
    const questions = [
      { p: `Công dân từ bao nhiêu tuổi được bầu cử?`, c: ["16", "18", "21", "25"], a: "18" },
      { p: `Hiến pháp là luật?`, c: ["Cao nhất", "Thường", "Pháp lệnh", "Nghị định"], a: "Cao nhất" },
      { p: `GDP là viết tắt của?`, c: ["Gross Domestic Product", "General Domestic Product", "Gross Development Product", "General Development Product"], a: "Gross Domestic Product" },
      { p: `Nghĩa vụ quân sự bắt đầu từ tuổi?`, c: ["18", "20", "21", "25"], a: "18" },
      { p: `Quốc hội có bao nhiêu đại biểu?`, c: ["500", "450", "400", "600"], a: "500" },
      { p: `VN gia nhập WTO năm?`, c: ["2005", "2006", "2007", "2008"], a: "2007" },
      { p: `Ai có quyền ban hành luật?`, c: ["Quốc hội", "Chính phủ", "Tòa án", "Công an"], a: "Quốc hội" },
      { p: `Độ tuổi vị thành viên là?`, c: ["Dưới 18", "Dưới 16", "Dưới 21", "Dưới 14"], a: "Dưới 18" },
      { p: `Quyền tự do ngôn luận thuộc?`, c: ["Quyền con người", "Nghĩa vụ", "Trách nhiệm", "Luật hình sự"], a: "Quyền con người" },
      { p: `Kinh tế thị trường định hướng XHCN có mấy thành phần?`, c: ["3", "2", "4", "1"], a: "3" },
      { p: `Thành phần kinh tế chủ đạo?`, c: ["Kinh tế nhà nước", "Kinh tế tư nhân", "Kinh tế hộ", "Kinh tế ngoại quốc"], a: "Kinh tế nhà nước" },
      { p: `Tòa án nhân dân tối cao là cơ quan?`, c: ["Judicial", "Hành chính", "Lập pháp", "Giáo dục"], a: "Judicial" },
      { p: `Bộ máy nhà nước gồm mấy branch?`, c: ["3", "2", "4", "5"], a: "3" },
      { p: `Công dân có nghĩa vụ gì?`, c: ["Nộp thuế", "Bảo vệ Tổ quốc", "Tất cả", "Không có"], a: "Tất cả" },
      { p: `Voting age ở VN?`, c: ["18", "16", "21", "25"], a: "18" },
      { p: `Hiến pháp hiện hành năm?`, c: ["2010", "2012", "2013", "2015"], a: "2013" },
      { p: `Chính phủ là cơ quan?`, c: ["Hành pháp", "Tư pháp", "Lập pháp", "Giáo dục"], a: "Hành pháp" },
      { p: `Tuổi thành niên theo luật VN?`, c: ["18", "16", "21", "20"], a: "18" },
      { p: `Đảng CSVN có bao nhiêu thành viên (2023)?`, c: ["5.3 triệu", "4 triệu", "6 triệu", "3 triệu"], a: "5.3 triệu" },
      { p: `Kinh tế tư nhân đóng góp bao nhiêu GDP?`, c: ["~40%", "~20%", "~60%", "~10%"], a: "~40%" },
    ];
    const qItem = questions[idx % questions.length];
    const topics = ["Công dân", "Luật", "Kinh tế", "Chính trị", "Đạo đức"];
    return q(`civic-${grade}-${String(idx%20+1).padStart(3,'0')}`, grade, "civic", topics[idx % topics.length], qItem.p, qItem.c, qItem.a);
  }),

  // ==================== NGỮ VĂN (Essay) ====================
  essay("lit-10-001", 10, "Nghị luận xã hội", "Viết đoạn văn ~200 chữ về vai trò của sách trong thời đại công nghệ.", "Sách giữ vai trò quan trọng trong việc phát triển tư duy, mở rộng kiến thức.", ["kiến thức", "tư duy", "phát triển"]),
  essay("lit-10-002", 10, "Phân tích tác phẩm", "Phân tích hình tượng người nông dân trong 'Tắt đèn'.", "Hình tượng chị Dậu thể hiện người nông dân nghèo khổ nhưng đầy sức sống.", ["chị Dậu", "nông dân", "nghèo khổ", "sức sống"]),
  essay("lit-10-003", 10, "Nghị luận", "Suy nghĩ về tầm quan trọng của việc học tập.", "Học tập giúp con người phát triển bản thân và cống hiến cho xã hội.", ["học tập", "phát triển", "cống hiến"]),
  essay("lit-11-001", 11, "Nghị luận văn học", "Phân tích giá trị nhân đạo trong 'Vợ nhặt'.", "Tác phẩm thể hiện tình yêu thương con người và niềm tin vào tương lai.", ["nhân đạo", "tình yêu thương", "niềm tin", "tương lai"]),
  essay("lit-11-002", 11, "Phân tích", "So sánh nhân vật Vũ Nương và người chồng.", "Vũ Nương là典型 phụ nữ Việt Nam: thủy chung, đức hạnh.", ["Vũ Nương", "thủy chung", "đức hạnh", "phụ nữ"]),
  essay("lit-12-001", 12, "Nghị luận văn học", "Phân tích nhân vật Đôn-ki-hô-tê qua đoạn trích.", "Đôn-ki-hô-tê thể hiện sự mâu thuẫn giữa ideal và thực tế.", ["đ理想", "thực tế", "nhân văn", "tưởng tượng"]),
  essay("lit-12-002", 12, "Nghị luận", "Suy nghĩ về vấn đề bảo vệ môi trường.", "Môi trường là tài sản quý giá cần được bảo vệ.", ["môi trường", "bảo vệ", "tài sản", "tương lai"]),
];

export function getSubjectsForMode(mode: "track" | "full", track: Track): Subject[] {
  if (mode === "full") {
    return ["math", "literature", "english", "physics", "chemistry", "history", "geography", "civic"];
  }
  if (track === "science") return ["math", "english", "physics", "chemistry"];
  if (track === "social") return ["literature", "history", "geography", "civic"];
  return ["math", "literature", "english", "physics", "chemistry"];
}

export function getAvailableQuestionsCount(subject: Subject, grade?: 10 | 11 | 12): number {
  let pool = QUESTION_BANK.filter(q => q.subject === subject && q.type === "mcq");
  if (grade) {
    pool = pool.filter(q => q.grade === grade);
  }
  return pool.length;
}

export function getSubjectConfig(subject: Subject, grade: 10 | 11 | 12): { count: number; isEssay: boolean } {
  const count = getAvailableQuestionsCount(subject, grade);
  const isEssay = false; // Tất cả đều là trắc nghiệm
  return { count: count || 10, isEssay };
}

export const TRACK_SUBJECTS: Record<Track, Subject[]> = {
  science: ["math", "english", "physics", "chemistry"],
  social: ["literature", "history", "geography", "civic"],
  mixed: ["math", "literature", "english", "physics", "chemistry", "history", "geography", "civic"],
};
