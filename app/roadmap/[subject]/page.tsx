"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icons } from "../../components/Icons";

interface AnswerAnalysis {
  questionId: string;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  topic: string;
  subject: string;
  points: number;
}

interface ExamResult {
  id: string;
  studentId: string;
  subject: string;
  examName: string;
  score: number;
  maxScore: number;
  date: string;
  answers: AnswerAnalysis[];
}

interface TopicAnalysis {
  topic: string;
  wrongCount: number;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  priority: "high" | "medium" | "low";
  lastWrongQuestions: string[];
  exercises: string[];
}

const SUBJECT_CONFIG: Record<string, { 
  name: string; 
  icon: string; 
  color: string;
  examTopics: { topic: string; subtopics: string[]; importance: "must" | "should" | "nice" }[];
  studyGuide: { title: string; icon: string; content: string[] }[];
}> = {
  math: {
    name: "Toán",
    icon: "Math",
    color: "#2563eb",
    examTopics: [
      { topic: "Hàm số và đồ thị", subtopics: ["Tính đơn điệu", "Cực trị", "GTLN-GTNN", "Tiệm cận"], importance: "must" },
      { topic: "Mũ và Logarit", subtopics: ["Tính toán mũ/log", "Phương trình mũ", "Phương trình log", "Bất phương trình"], importance: "must" },
      { topic: "Tích phân", subtopics: ["Nguyên hàm", "Tích phân xác định", "Ứng dụng tích phân"], importance: "must" },
      { topic: "Số phức", subtopics: ["Dạng đại số", "Dạng lượng giác", "Phương trình số phức"], importance: "should" },
      { topic: "Hình học không gian", subtopics: ["Thể tích khối đa diện", "Tọa độ trong không gian", "Mặt cầu"], importance: "should" },
      { topic: "Xác suất - Thống kê", subtopics: ["Tổ hợp", "Chỉnh hợp", "Xác suất", "Nhị thức Newton"], importance: "should" },
      { topic: "Hình giải tích Oxyz", subtopics: ["Phương trình mặt phẳng", "Phương trình đường thẳng", "Vị trí tương đối"], importance: "nice" },
    ],
    studyGuide: [
      { title: "Lý thuyết cần nắm vững", icon: "BookOpen", content: ["Công thức đạo hàm các hàm số cơ bản", "Quy tắc L'Hospital", "Công thức tích phân cơ bản", "Định nghĩa và tính chất logarit"] },
      { title: "Kỹ năng quan trọng", icon: "Bolt", content: ["Biến đổi đồ thị hàm số", "Giải phương trình bằng phương pháp đặt ẩn phụ", "Tính tích phân bằng phương pháp từng phần", "Xác định tâm và bán kính mặt cầu"] },
      { title: "Lỗi thường gặp", icon: "Warning", content: ["Nhầm công thức đạo hàm hàm hợp", "Quên điều kiện của logarit", "Sai dấu khi tính tích phân từng phần", "Nhầm công thức thể tích"] },
    ],
  },
  literature: {
    name: "Ngữ Văn",
    icon: "Literature",
    color: "#d97706",
    examTopics: [
      { topic: "Nghị luận xã hội", subtopics: ["Xác định vấn đề", "Luận điểm", "Luận cứ", "Lập luận"], importance: "must" },
      { topic: "Nghị luận văn học", subtopics: ["Phân tích tác phẩm", "Chuẩn bị dàn ý", "Viết đoạn văn nghị luận"], importance: "must" },
      { topic: "Tiểu thuyết", subtopics: ["Hồn Trương Ba da hàng thịt", "Vợ chồng A Phủ"], importance: "should" },
      { topic: "Truyện ngắn", subtopics: ["Chiếc thuyền ngoài xa", "Vợ nhặt", "Hai đứa trẻ"], importance: "should" },
      { topic: "Thơ trữ tình", subtopics: ["Đất Nước", "Việt Bắc", "Tây Tiến", "Độc Tiểu Thanh ký"], importance: "should" },
      { topic: "Ngữ pháp", subtopics: ["Từ loại", "Câu ghép", "Biện pháp tu từ"], importance: "nice" },
    ],
    studyGuide: [
      { title: "Cấu trúc bài nghị luận", icon: "File", content: ["Mở bài: Giới thiệu vấn đề (30-40 chữ)", "Thân bài: 2-3 luận điểm, mỗi luận điểm có luận cứ", "Kết bài: Khẳng định/đúc kết vấn đề"] },
      { title: "Cách phân tích tác phẩm", icon: "Search", content: ["Tìm hiểu hoàn cảnh sáng tác", "Xác định chủ đề, nội dung chính", "Phân tích chi tiết nghệ thuật", "Liên hệ bản thân/ thực tiễn"] },
      { title: "Lỗi thường gặp", icon: "Warning", content: ["Lạc đề, không bám sát yêu cầu", "Thiếu dẫn chứng cụ thể", "Viết lan man, không có trọng tâm", "Sai chính tả và ngữ pháp"] },
    ],
  },
  english: {
    name: "Tiếng Anh",
    icon: "English",
    color: "#059669",
    examTopics: [
      { topic: "Ngữ pháp", subtopics: ["Thì của động từ", "Câu bị động", "Mệnh đề quan hệ", "Câu điều kiện"], importance: "must" },
      { topic: "Từ vựng", subtopics: ["Word formation", "Collocation", "Idioms", "Phrasal verbs"], importance: "must" },
      { topic: "Đọc hiểu", subtopics: ["Tìm thông tin chi tiết", "Tìm ý chính", "Suy luận", "Từ vựng theo ngữ cảnh"], importance: "must" },
      { topic: "Giao tiếp", subtopics: ["Ngữ điệu", "Cách nói lịch sự", "Chức năng giao tiếp"], importance: "should" },
      { topic: "Viết", subtopics: ["Viết lại câu", "Viết bài luận ngắn", "Sửa lỗi sai"], importance: "should" },
    ],
    studyGuide: [
      { title: "12 Thì trong tiếng Anh", icon: "BookOpen", content: ["Simple Present: Thói quen, sự thật", "Present Continuous: Đang xảy ra", "Present Perfect: Quá khứ liên quan hiện tại", "Present Perfect Continuous: Đã làm và còn tiếp tục"] },
      { title: "Mẹo làm bài", icon: "Lightbulb", content: ["Đọc kỹ ngữ cảnh trước khi chọn đáp án", "Chú ý dấu hiệu thì qua trạng từ", "Phân biệt which/that/who/whom", "Nhớ các cấu trúc viết lại câu thường gặp"] },
      { title: "Lỗi thường gặp", icon: "Warning", content: ["Nhầm thì khi đọc đề bài", "Không phân biệt làm/trái/để", "Sai dạng của động từ sau modal", "Nhầm giữa some/any, much/many"] },
    ],
  },
  physics: {
    name: "Vật Lý",
    icon: "Physics",
    color: "#7c3aed",
    examTopics: [
      { topic: "Dao động cơ", subtopics: ["Dao động điều hòa", "Con lắc lò xo", "Con lắc đơn", "Tổng hợp dao động"], importance: "must" },
      { topic: "Sóng cơ", subtopics: ["Sóng cơ và sự truyền sóng", "Giao thoa sóng", "Sóng dừng", "Sóng âm"], importance: "must" },
      { topic: "Điện xoay chiều", subtopics: ["Đại cương dòng điện xoay chiều", "Mạch RLC", "Công suất", "Truyền tải điện"], importance: "must" },
      { topic: "Quang học", subtopics: ["Giao thoa ánh sáng", "Nhiễu xạ", "Thấu kính", "Lăng kính"], importance: "should" },
      { topic: "Hạt nhân", subtopics: ["Cấu tạo hạt nhân", "Phản ứng hạt nhân", "Năng lượng hạt nhân", "Phóng xạ"], importance: "should" },
      { topic: "Lượng tử ánh sáng", subtopics: ["Hiệu ứng quang điện", "Thuyết lượng tử", "Laser", "Tia X"], importance: "should" },
    ],
    studyGuide: [
      { title: "Công thức quan trọng", icon: "Math", content: ["x = A.cos(ωt + φ) - Phương trình dao động", "ω = 2π/T = 2πf - Tần số góc", "v = ω.A.cos(ωt + φ + π/2) - Vận tốc", "a = -ω².x - Gia tốc"] },
      { title: "Phương pháp giải bài", icon: "Bolt", content: ["Biểu diễn dao động bằng véctơ quay", "Sử dụng công thức độc lập thời gian", "Tính nhanh bằng máy tính Casio", "Vẽ đồ thị để phân tích"] },
      { title: "Lỗi thường gặp", icon: "Warning", content: ["Nhầm đơn vị (rad/s vs Hz)", "Sai dấu trong công thức tổng hợp", "Quên đổi đơn vị góc", "Nhầm giữa bước sóng và khoảng cách vân"] },
    ],
  },
  chemistry: {
    name: "Hóa Học",
    icon: "Chemistry",
    color: "#dc2626",
    examTopics: [
      { topic: "Este - Lipit", subtopics: ["Cấu tạo este", "Phản ứng thủy phân", "Xà phòng hóa", "Chất béo"], importance: "must" },
      { topic: "Cacbonhidrat", subtopics: ["Glucozơ", "Saccarozơ", "Tinh bột", "Cellulose"], importance: "must" },
      { topic: "Amin - Aminoaxit - Protein", subtopics: ["Tính chất amin", "Aminoaxit", "Peptit", "Protein"], importance: "must" },
      { topic: "Đại cương hóa hữu cơ", subtopics: ["Đồng đẳng", "Đồng phân", "Liên kết cộng hóa trị", "Phản ứng hữu cơ"], importance: "should" },
      { topic: "Polime", subtopics: ["Polime trùng hợp", "Polime trùng ngưng", "Vật liệu polime"], importance: "should" },
    ],
    studyGuide: [
      { title: "Phản ứng quan trọng", icon: "Bolt", content: ["Este + NaOH → Xà phòng + Rượu", "Glucozơ + AgNO₃/NH₃ → Ag", "Aminoaxit + HCl/NaOH → Muối", "Peptit + H₂O → Aminoaxit"] },
      { title: "Cách viết CTCT", icon: "Edit", content: ["Xác định nhóm chức chính", "Đếm số C theo dãy đồng đẳng", "Xác định mạch C chính", "Ghi các nhóm thế"] },
      { title: "Lỗi thường gặp", icon: "Warning", content: ["Nhầm sản phẩm phản ứng", "Sai công thức tổng quát", "Không cân bằng phương trình", "Quên điều kiện phản ứng"] },
    ],
  },
  history: {
    name: "Lịch Sử",
    icon: "History",
    color: "#4f46e5",
    examTopics: [
      { topic: "Cách mạng tháng Tám 1945", subtopics: ["Hoàn cảnh lịch sử", "Diễn biến", "Ý nghĩa lịch sử"], importance: "must" },
      { topic: "Kháng chiến chống Pháp", subtopics: ["Toàn quốc kháng chiến", "Chiến dịch Biên giới", "Điện Biên Phủ"], importance: "must" },
      { topic: "Kháng chiến chống Mỹ", subtopics: ["Chiến tranh cục bộ", "Chiến tranh phá hoại", "Tổng tiến công 1968", "Hồ Chí Minh 1975"], importance: "must" },
      { topic: "Xây dựng CNXH", subtopics: ["Xây dựng kinh tế", "Cải cách ruộng đất", "Công nghiệp hóa"], importance: "should" },
      { topic: "Việt Nam sau 1975", subtopics: ["Thống nhất đất nước", "Công nghiệp hóa, hiện đại hóa", "Đổi mới"], importance: "should" },
    ],
    studyGuide: [
      { title: "Mốc thời gian quan trọng", icon: "Calendar", content: ["2/9/1945: Tuyên ngôn độc lập", "19/12/1946: Toàn quốc kháng chiến", "7/5/1954: Chiến thắng Điện Biên Phủ", "30/4/1975: Giải phóng miền Nam"] },
      { title: "Cách trả lời câu hỏi", icon: "BookOpen", content: ["Nêu rõ thời gian, không gian", "Phân tích nguyên nhân", "Trình bày diễn biến chính", "Đánh giá ý nghĩa"] },
      { title: "Lỗi thường gặp", icon: "Warning", content: ["Sai/nhầm mốc thời gian", "Trình bày thiếu logic", "Thiếu dẫn chứng cụ thể", "Không phân tích được nguyên nhân"] },
    ],
  },
  geography: {
    name: "Địa Lý",
    icon: "Geography",
    color: "#0d9488",
    examTopics: [
      { topic: "Địa lý tự nhiên", subtopics: ["Địa hình", "Khí hậu", "Thủy văn", "Đất và sinh vật"], importance: "must" },
      { topic: "Địa lý dân cư", subtopics: ["Phân bố dân cư", "Đô thị hóa", "Lao động và việc làm"], importance: "must" },
      { topic: "Chuyển dịch cơ cấu kinh tế", subtopics: ["Công nghiệp", "Nông nghiệp", "Dịch vụ"], importance: "must" },
      { topic: "Địa lý các vùng", subtopics: ["Trung du miền núi Bắc Bộ", "Đồng bằng sông Hồng", "Tây Nguyên", "Đông Nam Bộ", "Đồng bằng sông Cửu Long"], importance: "must" },
      { topic: "Địa lý thế giới", subtopics: ["Tự nhiên thế giới", "Kinh tế-xã hội thế giới"], importance: "should" },
    ],
    studyGuide: [
      { title: "Cách phân tích bản đồ", icon: "Globe", content: ["Xác định vị trí, giới hạn lãnh thổ", "Đọc các yếu tố ký hiệu", "Phân tích mối liên hệ", "Rút ra nhận xét"] },
      { title: "Cách làm bài biểu đồ", icon: "Chart", content: ["Chọn loại biểu đồ phù hợp", "Xử lý số liệu", "Vẽ biểu đồ chính xác", "Nhận xét và giải thích"] },
      { title: "Lỗi thường gặp", icon: "Warning", content: ["Chọn sai loại biểu đồ", "Quên ghi đơn vị", "Nhận xét chung chung", "Không liên hệ các yếu tố"] },
    ],
  },
  civic: {
    name: "GDCD",
    icon: "Civic",
    color: "#ea580c",
    examTopics: [
      { topic: "Pháp luật", subtopics: ["Khái niệm pháp luật", "Quyền và nghĩa vụ", "Hệ thống pháp luật"], importance: "must" },
      { topic: "Quyền con người", subtopics: ["Quyền dân sự", "Quyền chính trị", "Quyền kinh tế", "Quyền văn hóa"], importance: "must" },
      { topic: "Quyền công dân", subtopics: ["Quyền bầu cử", "Quyền ứng cử", "Quyền tự do kinh doanh", "Quyền học tập"], importance: "must" },
      { topic: "Nghĩa vụ công dân", subtopics: ["Bảo vệ Tổ quốc", "Tuân thủ pháp luật", "Đóng góp xã hội"], importance: "should" },
      { topic: "Công dân với kinh tế", subtopics: ["Kinh tế thị trường", "Hội nhập kinh tế", "Kinh doanh theo pháp luật"], importance: "should" },
    ],
    studyGuide: [
      { title: "Khái niệm cần nhớ", icon: "BookOpen", content: ["Pháp luật: Hệ thống quy tắc do Nhà nước ban hành", "Quyền: Khả năng của cá nhân được pháp luật bảo vệ", "Nghĩa vụ: Điều công dân phải làm theo pháp luật"] },
      { title: "Cách trả lời câu hỏi thực tiễn", icon: "Lightbulb", content: ["Đọc kỹ đề bài, xác định vấn đề", "Liên hệ kiến thức đã học", "Đưa ra quan điểm cá nhân", "Nêu giải pháp cụ thể"] },
      { title: "Lỗi thường gặp", icon: "Warning", content: ["Trả lời thiếu căn cứ pháp luật", "Không phân biệt được quyền và nghĩa vụ", "Liên hệ thực tiễn chưa sát", "Thiếu ví dụ minh họa"] },
    ],
  },
};

export default function SubjectRoadmapPage() {
  const router = useRouter();
  const params = useParams();
  const subject = params.subject as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [checkedExercises, setCheckedExercises] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        if (!res.ok || !(await res.json()).authenticated) {
          router.push("/login");
          return;
        }
        
        const profileRes = await fetch("/api/student", { credentials: "include" });
        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data.profile);
          setExamResults(data.profile?.examResults || []);
          
          const saved = localStorage.getItem(`subject_${subject}_exercises`);
          if (saved) {
            setCheckedExercises(JSON.parse(saved));
          }
        }
      } catch (e) {
        console.error("Error:", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [subject, router]);

  const analyzeTopics = (): TopicAnalysis[] => {
    const topicMap: Record<string, TopicAnalysis> = {};
    
    examResults
      .filter(r => r.subject === subject)
      .forEach(exam => {
        exam.answers?.forEach(answer => {
          if (!topicMap[answer.topic]) {
            topicMap[answer.topic] = {
              topic: answer.topic,
              wrongCount: 0,
              correctCount: 0,
              totalQuestions: 0,
              accuracy: 0,
              priority: "medium",
              lastWrongQuestions: [],
              exercises: [],
            };
          }
          
          topicMap[answer.topic].totalQuestions++;
          if (answer.isCorrect) {
            topicMap[answer.topic].correctCount++;
          } else {
            topicMap[answer.topic].wrongCount++;
            if (topicMap[answer.topic].lastWrongQuestions.length < 3) {
              topicMap[answer.topic].lastWrongQuestions.push(answer.question);
            }
          }
        });
      });
    
    return Object.values(topicMap).map(t => {
      t.accuracy = t.totalQuestions > 0 
        ? Math.round((t.correctCount / t.totalQuestions) * 100) 
        : 0;
      
      if (t.accuracy < 40) t.priority = "high";
      else if (t.accuracy < 70) t.priority = "medium";
      else t.priority = "low";
      
      return t;
    }).sort((a, b) => a.accuracy - b.accuracy);
  };

  const toggleExercise = (topic: string, exercise: string) => {
    const key = `${topic}_${exercise}`;
    setCheckedExercises(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem(`subject_${subject}_exercises`, JSON.stringify(updated));
      return updated;
    });
  };

  const getProgress = () => {
    const analyzed = analyzeTopics();
    if (analyzed.length === 0) return { completed: 0, total: 0, percent: 0 };
    
    const total = analyzed.reduce((sum, t) => sum + t.exercises.length, 0);
    const completed = analyzed.reduce((sum, t) => {
      return sum + t.exercises.filter(ex => checkedExercises[`${t.topic}_${ex}`]).length;
    }, 0);
    
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const config = SUBJECT_CONFIG[subject];
  
  if (!config) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => router.push("/roadmap")}>
            ← Quay lại lộ trình
          </button>
        </div>
        <div style={styles.notFound}>Không tìm thấy môn học này</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Đang tải...</p>
      </div>
    );
  }

  const analyzedTopics = analyzeTopics();
  const userWeakTopics = analyzedTopics.filter(t => t.priority === "high" || t.priority === "medium");
  const progress = getProgress();

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.push("/roadmap")}>
          ← Quay lại lộ trình
        </button>
      </div>

      <div style={{...styles.subjectHeader, background: `linear-gradient(135deg, ${config.color}15, ${config.color}05)`}}>
        <div style={{...styles.subjectIcon, color: config.color}}>
          {(() => { const IconC = Icons[config.icon as keyof typeof Icons]; return IconC ? <IconC /> : null; })()}
        </div>
        <div style={styles.subjectInfo}>
          <h1 style={styles.subjectTitle}>{config.name}</h1>
          <p style={styles.subjectSubtitle}>
            {profile?.name} · Lớp {profile?.grade} · 
            {userWeakTopics.length > 0 
              ? `${userWeakTopics.length} chủ đề cần ôn tập`
              : "Chưa có dữ liệu bài kiểm tra"}
          </p>
        </div>
      </div>

      {analyzedTopics.length > 0 && (
        <div style={styles.progressCard}>
          <div style={styles.progressHeader}>
            <span style={{...styles.progressIcon, color: config.color}}><Icons.ChartBar /></span>
            <div style={styles.progressInfo}>
              <span style={styles.progressLabel}>Tiến độ cá nhân của bạn</span>
              <span style={styles.progressValue}>{progress.completed}/{progress.total} bài tập đã hoàn thành</span>
            </div>
          </div>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${progress.percent}%`, background: config.color}} />
          </div>
        </div>
      )}

      {userWeakTopics.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}><Icons.Target /> Chủ đề bạn cần ôn tập</h2>
          <div style={styles.topicList}>
            {userWeakTopics.map((topic, idx) => (
              <div key={idx} style={styles.topicCard}>
                <div style={styles.topicHeader}>
                  <div>
                    <span style={styles.topicName}>{topic.topic}</span>
                    <span style={{
                      ...styles.accuracyBadge,
                      background: topic.priority === "high" ? "#fef2f2" : "#fffbeb",
                      color: topic.priority === "high" ? "#dc2626" : "#d97706",
                    }}>
                      {topic.accuracy}% đúng
                    </span>
                  </div>
                  <span style={{
                    ...styles.priorityTag,
                    background: topic.priority === "high" ? "#ef4444" : "#f59e0b",
                  }}>
                    {topic.priority === "high" ? "Cần ôn ngay" : "Cần cải thiện"}
                  </span>
                </div>
                
                <div style={styles.topicStats}>
                  <div style={styles.topicStat}>
                    <span style={styles.topicStatNum}>{topic.correctCount}</span>
                    <span style={styles.topicStatLabel}>Đúng</span>
                  </div>
                  <div style={styles.topicStat}>
                    <span style={styles.topicStatNum} data-type="wrong">{topic.wrongCount}</span>
                    <span style={styles.topicStatLabel}>Sai</span>
                  </div>
                  <div style={styles.topicStat}>
                    <span style={styles.topicStatNum}>{topic.totalQuestions}</span>
                    <span style={styles.topicStatLabel}>Tổng</span>
                  </div>
                </div>

                {topic.lastWrongQuestions.length > 0 && (
                  <div style={styles.wrongQuestions}>
                    <span style={styles.wrongLabel}><Icons.Exam /> Câu bạn sai gần đây:</span>
                    {topic.lastWrongQuestions.map((q, i) => (
                      <div key={i} style={styles.wrongQuestion}>{q.substring(0, 100)}...</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}><Icons.Calendar /> Kế hoạch ôn tập 4 tuần</h2>
        
          <div style={styles.weekTabs}>
          {[1, 2, 3, 4].map(week => (
            <button
              key={week}
              style={{
                ...styles.weekTab,
                background: selectedWeek === week ? "#0891b2" : "#fff",
                color: selectedWeek === week ? "#fff" : "#64748b",
                border: selectedWeek === week ? "none" : "1px solid #e2e8f0",
                boxShadow: selectedWeek === week ? "0 2px 8px rgba(8, 145, 178, 0.3)" : "none",
              }}
              onClick={() => setSelectedWeek(week)}
            >
              Tuần {week}
            </button>
          ))}
        </div>

        <div style={styles.weekPlan}>
          {selectedWeek === 1 && (
            <div style={styles.weekContent}>
              <div style={styles.weekFocusBox}>
                <h3 style={styles.weekFocusTitle}><Icons.Target /> Mục tiêu tuần 1</h3>
                <p style={styles.weekFocusDesc}>Tập trung ôn tập <strong>các chủ đề yếu nhất</strong> (accuracy {'<'} 40%)</p>
              </div>
              {analyzedTopics.filter(t => t.priority === "high").length > 0 ? (
                <div style={styles.exerciseList}>
                  {analyzedTopics.filter(t => t.priority === "high").map((topic, idx) => (
                    <div key={idx} style={styles.exerciseCard}>
                      <div style={styles.exerciseTopic}>
                        <span style={{...styles.exerciseTopicBadge, background: config.color + "20", color: config.color}}>
                          {topic.topic}
                        </span>
                        <span style={styles.exerciseTopicAccuracy}>{topic.accuracy}%</span>
                      </div>
                      <div style={styles.exerciseItems}>
                        {config.examTopics.find(c => c.topic === topic.topic)?.subtopics.map((sub, i) => (
                          <label key={i} style={styles.exerciseItem}>
                            <span 
                              style={{
                                ...styles.checkbox,
                                background: checkedExercises[`${topic.topic}_${sub}`] ? config.color : "transparent",
                                borderColor: checkedExercises[`${topic.topic}_${sub}`] ? config.color : "#d1d5db",
                              }}
                              onClick={() => toggleExercise(topic.topic, sub)}
                            >
                              {checkedExercises[`${topic.topic}_${sub}`] && "✓"}
                            </span>
                            <span style={checkedExercises[`${topic.topic}_${sub}`] ? styles.exerciseChecked : undefined}>
                              {sub}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.noData}>Chưa có dữ liệu. Hãy làm bài kiểm tra để nhận kế hoạch cá nhân hóa.</p>
              )}
            </div>
          )}

          {selectedWeek === 2 && (
            <div style={styles.weekContent}>
              <div style={styles.weekFocusBox}>
                <h3 style={styles.weekFocusTitle}><Icons.Target /> Mục tiêu tuần 2</h3>
                <p style={styles.weekFocusDesc}>Cải thiện <strong>chủ đề trung bình</strong> và ôn lại kiến thức tuần 1</p>
              </div>
              {analyzedTopics.filter(t => t.priority === "medium").length > 0 ? (
                <div style={styles.exerciseList}>
                  {analyzedTopics.filter(t => t.priority === "medium").map((topic, idx) => (
                    <div key={idx} style={styles.exerciseCard}>
                      <div style={styles.exerciseTopic}>
                        <span style={{...styles.exerciseTopicBadge, background: config.color + "20", color: config.color}}>
                          {topic.topic}
                        </span>
                        <span style={styles.exerciseTopicAccuracy}>{topic.accuracy}%</span>
                      </div>
                      <div style={styles.exerciseItems}>
                        {config.examTopics.find(c => c.topic === topic.topic)?.subtopics.map((sub, i) => (
                          <label key={i} style={styles.exerciseItem}>
                            <span 
                              style={{
                                ...styles.checkbox,
                                background: checkedExercises[`${topic.topic}_${sub}`] ? config.color : "transparent",
                                borderColor: checkedExercises[`${topic.topic}_${sub}`] ? config.color : "#d1d5db",
                              }}
                              onClick={() => toggleExercise(topic.topic, sub)}
                            >
                              {checkedExercises[`${topic.topic}_${sub}`] && "✓"}
                            </span>
                            <span style={checkedExercises[`${topic.topic}_${sub}`] ? styles.exerciseChecked : undefined}>
                              {sub}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.noData}>Không có chủ đề trung bình. Tiếp tục ôn tập kiến thức đã học!</p>
              )}
            </div>
          )}

          {selectedWeek === 3 && (
            <div style={styles.weekContent}>
              <div style={styles.weekFocusBox}>
                <h3 style={styles.weekFocusTitle}><Icons.Target /> Mục tiêu tuần 3</h3>
                <p style={styles.weekFocusDesc}><strong>Luyện đề</strong> và kiểm tra kiến thức tổng hợp</p>
              </div>
              <div style={styles.practiceSection}>
                <div style={styles.practiceCard}>
                  <span style={{...styles.practiceIcon, color: config.color}}><Icons.Exam /></span>
                  <div>
                    <h4 style={styles.practiceTitle}>Làm đề thi thử</h4>
                    <p style={styles.practiceDesc}>Làm 1-2 đề thi thử môn {config.name}</p>
                  </div>
                </div>
                <div style={styles.practiceCard}>
                  <span style={{...styles.practiceIcon, color: config.color}}><Icons.BookOpen /></span>
                  <div>
                    <h4 style={styles.practiceTitle}>Ôn tập lý thuyết</h4>
                    <p style={styles.practiceDesc}>Đọc lại toàn bộ lý thuyết đã học</p>
                  </div>
                </div>
                <div style={styles.practiceCard}>
                  <span style={{...styles.practiceIcon, color: config.color}}><Icons.Refresh /></span>
                  <div>
                    <h4 style={styles.practiceTitle}>Giải lại bài sai</h4>
                    <p style={styles.practiceDesc}>Xem lại các câu đã sai trong bài kiểm tra</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedWeek === 4 && (
            <div style={styles.weekContent}>
              <div style={styles.weekFocusBox}>
                <h3 style={styles.weekFocusTitle}><Icons.Target /> Mục tiêu tuần 4</h3>
                <p style={styles.weekFocusDesc}><strong>Ôn tổng hợp</strong> và chuẩn bị cho kỳ thi</p>
              </div>
              <div style={styles.practiceSection}>
                <div style={styles.practiceCard}>
                  <span style={{...styles.practiceIcon, color: config.color}}><Icons.CheckCircle /></span>
                  <div>
                    <h4 style={styles.practiceTitle}>Kiểm tra lại toàn bộ</h4>
                    <p style={styles.practiceDesc}>Đảm bảo đã hoàn thành tất cả bài tập</p>
                  </div>
                </div>
                <div style={styles.practiceCard}>
                  <span style={{...styles.practiceIcon, color: config.color}}><Icons.Target /></span>
                  <div>
                    <h4 style={styles.practiceTitle}>Làm đề cuối cùng</h4>
                    <p style={styles.practiceDesc}>Làm 1 đề thi thử để đánh giá</p>
                  </div>
                </div>
                <div style={styles.practiceCard}>
                  <span style={{...styles.practiceIcon, color: config.color}}><Icons.Party /></span>
                  <div>
                    <h4 style={styles.practiceTitle}>Nghỉ ngơi</h4>
                    <p style={styles.practiceDesc}>Không học căng thẳng ngày trước thi</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}><Icons.Lightbulb /> Hướng dẫn ôn tập</h2>
        {config.studyGuide.map((guide, idx) => {
          const IconC = Icons[guide.icon as keyof typeof Icons];
          return (
            <div key={idx} style={styles.guideCard}>
              <h3 style={styles.guideTitle}>
                {IconC && <span style={{ marginRight: 8, color: config.color }}><IconC /></span>}
                {guide.title}
              </h3>
              <ul style={styles.guideList}>
                {guide.content.map((item, i) => (
                  <li key={i} style={styles.guideItem}>{item}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div style={styles.actions}>
        <button style={styles.primaryBtn} onClick={() => router.push("/exam")}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icons.Exam />
            Làm bài kiểm tra
          </span>
        </button>
        <button style={styles.secondaryBtn} onClick={() => router.push("/scores")}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icons.ChartBar />
            Xem điểm số
          </span>
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)",
    padding: "20px",
    fontFamily: "'Roboto', sans-serif",
    maxWidth: 800,
    margin: "0 auto",
  },
  loading: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    background: "#f8fafc",
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #0891b2",
    animation: "spin 1s linear infinite",
  },
  header: { marginBottom: 16 },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    color: "#0891b2",
    cursor: "pointer",
    padding: "8px 0",
  },
  subjectHeader: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    background: "#fff",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    border: "1px solid #f1f5f9",
  },
  subjectIcon: { fontSize: 48, display: "flex", alignItems: "center", justifyContent: "center" },
  subjectInfo: { flex: 1 },
  subjectTitle: { fontSize: 28, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" },
  subjectSubtitle: { fontSize: 14, color: "#64748b", margin: 0 },
  progressCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  },
  progressHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  progressIcon: { fontSize: 24 },
  progressInfo: { flex: 1 },
  progressLabel: { display: "block", fontSize: 12, color: "#94a3b8" },
  progressValue: { fontSize: 14, fontWeight: 600, color: "#0f172a" },
  progressBar: { height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99, transition: "width 0.3s" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" },
  topicList: { display: "flex", flexDirection: "column", gap: 12 },
  topicCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  },
  topicHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
    flexWrap: "wrap",
  },
  topicName: { fontSize: 15, fontWeight: 600, color: "#0f172a", marginRight: 8 },
  accuracyBadge: { padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 500 },
  priorityTag: { padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, color: "#fff" },
  topicStats: { display: "flex", gap: 24, marginBottom: 12 },
  topicStat: { textAlign: "center" as const },
  topicStatNum: { display: "block", fontSize: 18, fontWeight: 700, color: "#10b981" },
  topicStatLabel: { fontSize: 11, color: "#94a3b8" },
  wrongQuestions: { background: "#fef2f2", borderRadius: 10, padding: 12 },
  wrongLabel: { fontSize: 12, fontWeight: 600, color: "#dc2626", display: "block", marginBottom: 8 },
  wrongQuestion: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  weekTabs: { 
    display: "flex", 
    gap: 8, 
    marginBottom: 16,
    background: "#fff",
    padding: 6,
    borderRadius: 14,
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  },
  weekTab: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 10,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  weekPlan: { animation: "fadeIn 0.3s ease" },
  weekContent: {},
  weekFocusBox: {
    background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: "0 4px 12px rgba(8, 145, 178, 0.3)",
  },
  weekFocusTitle: { fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 8px" },
  weekFocusDesc: { fontSize: 14, color: "rgba(255,255,255,0.9)", margin: 0, lineHeight: 1.6 },
  exerciseList: { display: "flex", flexDirection: "column", gap: 12 },
  exerciseCard: {
    background: "#fff",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #f1f5f9",
  },
  exerciseTopic: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  exerciseTopicBadge: { padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600 },
  exerciseTopicAccuracy: { fontSize: 13, fontWeight: 700, color: "#64748b" },
  exerciseItems: { display: "flex", flexDirection: "column", gap: 8 },
  exerciseItem: { display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "8px 0" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    transition: "all 0.15s",
    flexShrink: 0,
  },
  exerciseChecked: { color: "#94a3b8", textDecoration: "line-through" },
  practiceSection: { display: "flex", flexDirection: "column", gap: 12 },
  practiceCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "#fff",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #f1f5f9",
  },
  practiceIcon: { fontSize: 32, flexShrink: 0 },
  practiceTitle: { fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 4px" },
  practiceDesc: { fontSize: 13, color: "#64748b", margin: 0 },
  guideCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #f1f5f9",
  },
  guideTitle: { fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" },
  guideList: { margin: 0, paddingLeft: 20 },
  guideItem: { fontSize: 13, color: "#374151", marginBottom: 8, lineHeight: 1.6 },
  noData: { fontSize: 14, color: "#94a3b8", textAlign: "center", padding: 24, background: "#fff", borderRadius: 12 },
  actions: { display: "flex", gap: 12, marginTop: 24, paddingBottom: 40 },
  primaryBtn: {
    flex: 1,
    padding: "14px 24px",
    background: "linear-gradient(135deg, #0891b2, #06b6d4)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(8, 145, 178, 0.4)",
  },
  secondaryBtn: {
    flex: 1,
    padding: "14px 24px",
    background: "#fff",
    color: "#0891b2",
    border: "1.5px solid #0891b2",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  notFound: { textAlign: "center", padding: 48, fontSize: 16, color: "#64748b" },
};
