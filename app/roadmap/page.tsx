"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "../components/Icons";

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
  weakTopics: string[];
  strongTopics: string[];
}

interface TopicDetail {
  topic: string;
  subject: string;
  subjectName: string;
  subjectColor: string;
  wrongCount: number;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  exercises: string[];
  priority: "high" | "medium" | "low";
  advice: string;
}

interface LearningPath {
  week: number;
  title: string;
  focus: string;
  topics: string[];
  exercises: { type: string; description: string; link: string }[];
  targetScore: number;
  duration: string;
}

interface Roadmap {
  studentId: string;
  generatedAt: string;
  overallLevel: "beginner" | "intermediate" | "advanced";
  estimatedDays: number;
  weeklyPlan: LearningPath[];
  priorityTopics: TopicDetail[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

const SUBJECT_INFO: Record<string, { name: string; icon: string; color: string; track: string[] }> = {
  math: { name: "Toán", icon: "Math", color: "#2563eb", track: ["science", "social", "mixed"] },
  literature: { name: "Ngữ Văn", icon: "Literature", color: "#d97706", track: ["social", "mixed"] },
  english: { name: "Tiếng Anh", icon: "English", color: "#059669", track: ["science", "social", "mixed"] },
  physics: { name: "Vật Lý", icon: "Physics", color: "#7c3aed", track: ["science", "mixed"] },
  chemistry: { name: "Hóa Học", icon: "Chemistry", color: "#dc2626", track: ["science", "mixed"] },
  history: { name: "Lịch Sử", icon: "History", color: "#4f46e5", track: ["social", "mixed"] },
  geography: { name: "Địa Lý", icon: "Geography", color: "#0d9488", track: ["social", "mixed"] },
  civic: { name: "GDCD", icon: "Civic", color: "#ea580c", track: ["social", "mixed"] },
};

const TOPIC_EXERCISES: Record<string, string[]> = {
  "Mệnh đề và tập hợp": ["Bài tập tập hợp", "Phép toán tập hợp", "Biểu đồ Ven"],
  "Hàm số bậc nhất": ["Vẽ đồ thị", "Tìm hệ số góc", "Bài toán thực tế"],
  "Phương trình": ["PT bậc nhất", "PT bậc 2", "Hệ PT"],
  "Lũy thừa - Mũ": ["Tính lũy thừa", "Phương trình mũ", "Bất phương trình mũ"],
  "Logarit": ["Tính logarit", "PT logarit", "Bất PT logarit"],
  "Tích phân": ["Nguyên hàm", "Tích phân xác định", "Ứng dụng"],
  "Xác suất": ["Tổ hợp", "Chỉnh hợp", "Xác suất cổ điển"],
  "Hàm số": ["Tính đơn điệu", "Cực trị", "GTLN-GTNN"],
  "Số phức": ["Dạng đại số", "Dạng lượng giác", "PT số phức"],
  "Hình học": ["Hình tam giác", "Đường tròn", "Hình không gian"],
  "Cơ học": ["Chuyển động", "Lực và ma sát", "Công và năng lượng"],
  "Nhiệt học": ["Nhiệt lượng", "Truyền nhiệt", "Phương trình cân bằng nhiệt"],
  "Điện học": ["Dòng điện", "Mạch điện", "Công suất điện"],
  "Quang học": ["Gương", "Thấu kính", "Mắt và kính"],
  "Sóng": ["Sóng cơ", "Sóng âm", "Giao thoa sóng"],
  "Grammar/Vocabulary": ["Tenses", "Passive Voice", "Conditional", "Vocabulary building"],
  "Nguyên tử": ["Cấu trúc nguyên tử", "Bảng tuần hoàn", "Đồng vị"],
  "Liên kết": ["Liên kết ion", "Liên kết cộng hóa trị", "Liên kết kim loại"],
  "Phản ứng": ["Phản ứng oxi hóa-khử", "Phản ứng trao đổi", "Cân bằng phản ứng"],
  "Cân bằng": ["Tốc độ phản ứng", "Cân bằng hóa học", "Nguyên lý Le Chatelier"],
  "default": ["Ôn lại lý thuyết", "Làm bài tập cơ bản", "Giải đề thi"],
};

const LEVEL_LABEL: Record<string, string> = {
  beginner: "🟢 Mới bắt đầu",
  intermediate: "🟡 Trung bình",
  advanced: "🔴 Nâng cao",
};

export default function RoadmapPage() {
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "plan">("overview");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<ExamResult[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include"
        });
        
        if (!res.ok) {
          router.push("/login");
          return;
        }
        
        const data = await res.json();
        
        if (!data.authenticated) {
          router.push("/login");
          return;
        }
        
        if (!data.hasProfile) {
          router.push("/onboarding");
          return;
        }
        
        const profileRes = await fetch("/api/student", {
          credentials: "include"
        });
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.profile);
          setResults(profileData.profile?.examResults || []);
          if (profileData.profile?.roadmap) {
            setRoadmap(profileData.profile.roadmap);
          } else if (profileData.profile?.examResults?.length >= 2) {
            generateRoadmap(profileData.profile);
          }
        }
      } catch (e) {
        console.error("Auth error:", e);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  const generateRoadmap = async (studentProfile: any) => {
    setGenerating(true);
    try {
      const res = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ student: studentProfile }),
        credentials: "include"
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.roadmap) {
          setRoadmap(data.roadmap);
        }
      }
    } catch (e) {
      console.error("Generate roadmap error:", e);
    } finally {
      setGenerating(false);
    }
  };

  const analyzeResults = (): { topicDetails: TopicDetail[]; avgScore: number; totalExams: number } => {
    const topicMap: Record<string, TopicDetail> = {};
    let totalScore = 0;
    let totalMax = 0;

    results.forEach(exam => {
      const score10 = (exam.score / exam.maxScore) * 10;
      totalScore += exam.score;
      totalMax += exam.maxScore;
      
      exam.answers?.forEach((answer: AnswerAnalysis) => {
        const key = `${answer.topic}-${answer.subject}`;
        if (!topicMap[key]) {
          const subjectInfo = SUBJECT_INFO[answer.subject] || { name: answer.subject, color: "#64748b" };
          topicMap[key] = {
            topic: answer.topic,
            subject: answer.subject,
            subjectName: subjectInfo.name,
            subjectColor: subjectInfo.color,
            wrongCount: 0,
            correctCount: 0,
            totalQuestions: 0,
            accuracy: 0,
            exercises: TOPIC_EXERCISES[answer.topic] || TOPIC_EXERCISES.default,
            priority: "medium",
            advice: "",
          };
        }
        
        topicMap[key].totalQuestions++;
        if (answer.isCorrect) {
          topicMap[key].correctCount++;
        } else {
          topicMap[key].wrongCount++;
        }
      });
    });

    const topicDetails = Object.values(topicMap).map(t => {
      t.accuracy = t.totalQuestions > 0 ? (t.correctCount / t.totalQuestions) * 100 : 0;
      
      if (t.accuracy < 40) {
        t.priority = "high";
        t.advice = "Cần ôn tập kỹ lý thuyết và làm nhiều bài tập cơ bản";
      } else if (t.accuracy < 70) {
        t.priority = "medium";
        t.advice = "Cần luyện tập thêm để cải thiện";
      } else {
        t.priority = "low";
        t.advice = "Đã nắm vững, tiếp tục ôn tập để duy trì";
      }
      
      return t;
    });

    topicDetails.sort((a, b) => a.accuracy - b.accuracy);

    return {
      topicDetails,
      avgScore: totalMax > 0 ? (totalScore / totalMax) * 10 : 0,
      totalExams: results.length,
    };
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.spinner} />
        <p>Đang tải...</p>
      </div>
    );
  }

  const analysis = results.length > 0 ? analyzeResults() : null;
  const showEmpty = !roadmap && (!analysis || analysis.totalExams < 2);

  if (showEmpty) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.push("/dashboard")}>
          <Icons.Back /> Quay lại
        </button>
          <h1 style={styles.title}><Icons.Roadmap /> Lộ trình học</h1>
        </div>

        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}><Icons.Chart /></div>
          <h2 style={styles.emptyTitle}>Chưa có đủ dữ liệu</h2>
          <p style={styles.emptyText}>
            Bạn cần hoàn thành ít nhất <strong>2 bài kiểm tra</strong> để AI phân tích và tạo lộ trình học cá nhân hóa.
          </p>
          {analysis && (
            <div style={styles.quickStats}>
              <div style={styles.quickStat}>
                <span style={styles.quickStatValue}>{analysis.totalExams}</span>
                <span style={styles.quickStatLabel}>Bài đã làm</span>
              </div>
              <div style={styles.quickStat}>
                <span style={styles.quickStatValue}>{analysis.avgScore.toFixed(1)}</span>
                <span style={styles.quickStatLabel}>Điểm TB</span>
              </div>
            </div>
          )}
          <button
            style={styles.primaryBtn}
            onClick={() => router.push("/exam")}
          >
            Làm bài kiểm tra →
          </button>
        </div>
      </div>
    );
  }

  const userTrack = profile?.track || "mixed";
  const trackSubjects = Object.keys(SUBJECT_INFO).filter(s => 
    SUBJECT_INFO[s].track.includes(userTrack)
  );

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.push("/dashboard")}>
          <Icons.Back /> Quay lại
        </button>
        <div style={styles.headerInfo}>
          <h1 style={styles.title}><Icons.Roadmap /> Lộ trình học cá nhân</h1>
          <p style={styles.subtitle}>
            {profile?.name} · Lớp {profile?.grade} · 
            {roadmap ? `Cập nhật: ${new Date(roadmap.generatedAt).toLocaleDateString("vi-VN")}` : "Phân tích mới nhất"}
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      {analysis && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}><Icons.Exam /></div>
            <div style={styles.statValue}>{analysis.totalExams}</div>
            <div style={styles.statLabel}>Bài đã làm</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}><Icons.Chart /></div>
            <div style={styles.statValue}>{analysis.avgScore.toFixed(1)}/10</div>
            <div style={styles.statLabel}>Điểm TB</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}><Icons.Flag /></div>
            <div style={styles.statValue}>{analysis.topicDetails.filter(t => t.priority === "high").length}</div>
            <div style={styles.statLabel}>Chủ đề yếu</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}><Icons.Target /></div>
            <div style={styles.statValue}>{profile?.targetSchoolScore || 7}/10</div>
            <div style={styles.statLabel}>Mục tiêu</div>
          </div>
        </div>
      )}

      {/* Progress to Goal */}
      {analysis && (
        <div style={styles.goalCard}>
          <div style={styles.goalHeader}>
            <span style={styles.goalIcon}><Icons.Target /></span>
            <div>
              <div style={styles.goalLabel}>Tiến độ đến mục tiêu</div>
              <div style={styles.goalValue}>
                {analysis.avgScore.toFixed(1)} / {profile?.targetSchoolScore || 7} điểm
              </div>
            </div>
          </div>
          <div style={styles.goalProgress}>
            <div style={{...styles.goalProgressFill, 
              width: `${Math.min(100, (analysis.avgScore / (profile?.targetSchoolScore || 7)) * 100)}%`,
              background: analysis.avgScore >= (profile?.targetSchoolScore || 7) ? "#10b981" : "#3b82f6"
            }} />
          </div>
          <div style={styles.goalStatus}>
            {analysis.avgScore >= (profile?.targetSchoolScore || 7)
              ? "✓ Đã đạt mục tiêu! Tiếp tục duy trì"
              : `Cần thêm ${((profile?.targetSchoolScore || 7) - analysis.avgScore).toFixed(1)} điểm để đạt mục tiêu`}
          </div>
        </div>
      )}

      {/* Subject Filter */}
      <div style={styles.subjectFilter}>
        <button
          style={{
            ...styles.subjectFilterBtn,
            background: "linear-gradient(135deg, #0891b2, #06b6d4)",
            color: "#fff",
            borderColor: "transparent",
          }}
          onClick={() => router.push("/roadmap")}
        >
          <Icons.Grid /> Tất cả các môn
        </button>
        {trackSubjects.map(subject => {
          const info = SUBJECT_INFO[subject];
          const subjectTopics = analysis?.topicDetails.filter(t => t.subject === subject) || [];
          const hasTopics = subjectTopics.length > 0;
          
          return (
            <button
              key={subject}
              style={{
                ...styles.subjectFilterBtn,
                background: "#fff",
                color: info.color,
                borderColor: info.color,
                opacity: hasTopics ? 1 : 0.5,
              }}
              onClick={() => router.push(`/roadmap/${subject}`)}
            >
              {info.icon} {info.name}
              {hasTopics && (
                <span style={{
                  ...styles.subjectBadge,
                  background: info.color,
                  color: "#fff",
                }}>
                  {subjectTopics.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: "overview", label: "Tổng quan", icon: <Icons.ChartLine /> },
          { key: "plan", label: "Kế hoạch", icon: <Icons.Calendar /> },
        ].map(tab => (
          <button
            key={tab.key}
            style={{
              ...styles.tab,
              background: activeTab === tab.key ? "#3b82f6" : "#fff",
              color: activeTab === tab.key ? "#fff" : "#64748b",
              borderColor: activeTab === tab.key ? "#3b82f6" : "#e2e8f0",
            }}
            onClick={() => setActiveTab(tab.key as any)}
          >
            <span style={{ marginRight: 4, display: "flex", alignItems: "center" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && analysis && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Phân tích điểm mạnh & yếu</h3>
          
          <div style={styles.strengthWeakness}>
            <div style={styles.strengthCard}>
              <div style={styles.cardHeader}>
                <span style={styles.cardIcon}>💪</span>
                <span>Điểm mạnh</span>
              </div>
              {analysis.topicDetails.filter(t => t.accuracy >= 70).length > 0 ? (
                <div style={styles.topicTags}>
                  {analysis.topicDetails.filter(t => t.accuracy >= 70).slice(0, 5).map((t, i) => (
                    <div key={i} style={{...styles.topicTag, background: "#ecfdf5", color: "#059669"}}>
                      {t.topic} ({t.accuracy.toFixed(0)}%)
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.noData}>Chưa có chủ đề nào đạt mức tốt</p>
              )}
            </div>

            <div style={styles.weaknessCard}>
              <div style={styles.cardHeader}>
                <span style={styles.cardIcon}>📚</span>
                <span>Cần cải thiện</span>
              </div>
              {analysis.topicDetails.filter(t => t.accuracy < 70).length > 0 ? (
                <div style={styles.topicTags}>
                  {analysis.topicDetails.filter(t => t.accuracy < 70).slice(0, 5).map((t, i) => (
                    <div key={i} style={{...styles.topicTag, background: "#fee2e2", color: "#b91c1c"}}>
                      {t.topic} ({t.accuracy.toFixed(0)}%)
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.noData}>Tuyệt vời! Bạn đang làm tốt ở tất cả các chủ đề</p>
              )}
            </div>
          </div>

          {/* Visual Roadmap Timeline */}
          <h3 style={styles.sectionTitle}>Lộ trình học tập</h3>
          <div style={styles.timeline}>
            {[1, 2, 3, 4].map(week => {
              const weekTopics = analysis.topicDetails
                .filter(t => t.priority === "high")
                .slice((week - 1) * 2, week * 2);
              const weekTarget = (profile?.targetSchoolScore || 7) - (analysis.avgScore * (week / 4)) + (analysis.avgScore * ((week - 1) / 4));
              
              return (
                <div key={week} style={styles.timelineItem}>
                  <div style={styles.timelineDot}>
                    <span style={styles.timelineWeek}>Tuần {week}</span>
                  </div>
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineTitle}>
                      {week === 1 ? "Ôn tập cơ bản" : 
                       week === 2 ? "Luyện tập nâng cao" : 
                       week === 3 ? "Giải đề thi" : "Ôn tổng hợp"}
                    </div>
                    <div style={styles.timelineTopics}>
                      {weekTopics.map((t, i) => (
                        <span key={i} style={{...styles.timelineTag, background: t.subjectColor + "20", color: t.subjectColor}}>
                          {t.topic}
                        </span>
                      ))}
                    </div>
                    <div style={styles.timelineTarget}>
                      Mục tiêu: {(analysis.avgScore + ((profile?.targetSchoolScore || 7) - analysis.avgScore) * (week / 4)).toFixed(1)}/10
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Plan Tab */}
      {activeTab === "plan" && analysis && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Kế hoạch học tập 4 tuần</h3>
          <div style={styles.weekPlanList}>
            {[1, 2, 3, 4].map(week => {
              const weakTopics = analysis.topicDetails.filter(t => t.priority === "high");
              const mediumTopics = analysis.topicDetails.filter(t => t.priority === "medium");
              
              let weekTopics: typeof analysis.topicDetails = [];
              let focus = "";
              
              if (week === 1) {
                weekTopics = weakTopics.slice(0, 3);
                focus = "Tập trung ôn tập kiến thức cơ bản của các chủ đề yếu";
              } else if (week === 2) {
                weekTopics = [...weakTopics.slice(3), ...mediumTopics.slice(0, 2)];
                focus = "Luyện tập nâng cao và giải bài tập khó";
              } else if (week === 3) {
                weekTopics = mediumTopics.slice(2);
                focus = "Giải đề thi thử và kiểm tra";
              } else {
                weekTopics = analysis.topicDetails.slice(0, 4);
                focus = "Ôn tổng hợp và chuẩn bị cho kỳ thi";
              }

              const targetScore = (analysis.avgScore + ((profile?.targetSchoolScore || 7) - analysis.avgScore) * (week / 4)).toFixed(1);

              return (
                <div key={week} style={styles.weekPlanCard}>
                  <div style={styles.weekPlanHeader}>
                    <div style={styles.weekPlanNumber}>Tuần {week}</div>
                    <div style={styles.weekPlanTarget}>Mục tiêu: {targetScore}/10</div>
                  </div>
                  
                  <div style={styles.weekPlanFocus}>{focus}</div>
                  
                  <div style={styles.weekPlanTopics}>
                    <div style={styles.weekPlanTopicsLabel}>Chủ đề cần ôn:</div>
                    <div style={styles.weekPlanTopicsList}>
                      {weekTopics.map((t, i) => (
                        <span key={i} style={{...styles.weekPlanTopic, borderColor: t.subjectColor, color: t.subjectColor}}>
                          {SUBJECT_INFO[t.subject]?.icon} {t.topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={styles.weekPlanDuration}><Icons.Timer /> Thời gian: 2-3 giờ/ngày</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={styles.actionSection}>
        <button 
          style={styles.primaryBtn} 
          onClick={() => router.push("/exam")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(8, 145, 178, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(8, 145, 178, 0.3)";
          }}
        >
          <Icons.Exam /> Làm bài kiểm tra
        </button>
        <button 
          style={styles.secondaryBtn} 
          onClick={() => router.push("/scores")}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #0891b2, #06b6d4)";
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = "#0891b2";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Icons.Chart /> Xem bảng điểm
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#F4F7F6",
    padding: "24px 20px",
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
    background: "#F4F7F6",
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #0891b2",
    animation: "spin 1s linear infinite",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    color: "#0891b2",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  headerInfo: { flex: 1 },
  title: { fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 10 },
  subtitle: { fontSize: 14, color: "#737373", margin: 0 },
  emptyCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 48,
    textAlign: "center",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  emptyIcon: { display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: "#94a3b8" },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" },
  emptyText: { fontSize: 14, color: "#737373", lineHeight: 1.6, margin: "0 0 24px" },
  quickStats: {
    display: "flex",
    justifyContent: "center",
    gap: 32,
    marginBottom: 24,
  },
  quickStat: {
    textAlign: "center",
  },
  quickStatValue: {
    display: "block",
    fontSize: 24,
    fontWeight: 800,
    color: "#3b82f6",
  },
  quickStatLabel: {
    fontSize: 12,
    color: "#737373",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 14,
    marginBottom: 24,
  },
  statCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 18,
    textAlign: "center",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  statIcon: { 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    marginBottom: 10,
    color: "#0891b2",
  },
  statValue: { fontSize: 22, fontWeight: 800, color: "#0891b2" },
  statLabel: { fontSize: 12, color: "#737373" },
  goalCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  goalHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  goalIcon: { fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" },
  goalLabel: { fontSize: 13, color: "#737373" },
  goalValue: { fontSize: 18, fontWeight: 700, color: "#0f172a" },
  goalProgress: {
    height: 10,
    background: "#e0f2fe",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 10,
  },
  goalProgressFill: {
    height: "100%",
    borderRadius: 99,
    transition: "width 0.4s ease",
    background: "linear-gradient(90deg, #06b6d4, #0891b2, #3b82f6)",
  },
  goalStatus: { fontSize: 13, color: "#666666" },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    background: "#fff",
    padding: 6,
    borderRadius: 14,
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  },
  tab: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: 10,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  section: { marginBottom: 20 },
  subjectFilter: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    overflowX: "auto",
    paddingBottom: 8,
  },
  subjectFilterBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 16px",
    borderRadius: 24,
    border: "1.5px solid",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
  },
  subjectBadge: {
    padding: "2px 6px",
    borderRadius: 99,
    fontSize: 10,
    fontWeight: 700,
  },
  subjectDetailPanel: {
    background: "#fff",
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  subjectDetailHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
    paddingBottom: 18,
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  subjectDetailInfo: { flex: 1 },
  subjectDetailTitle: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 },
  subjectDetailStats: { fontSize: 14, color: "#737373", margin: "6px 0 0" },
  closeSubjectBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#64748b",
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  subjectTopicsList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  subjectTopicCard: {
    background: "#f8fafc",
    borderRadius: 14,
    padding: 18,
  },
  subjectTopicHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  subjectTopicName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#0f172a",
  },
  subjectTopicStats: {
    display: "flex",
    gap: 24,
    marginBottom: 12,
  },
  subjectTopicStat: { textAlign: "center" },
  subjectTopicStatValue: {
    display: "block",
    fontSize: 18,
    fontWeight: 700,
    color: "#0891b2",
  },
  subjectTopicStatLabel: { fontSize: 11, color: "#737373" },
  subjectTopicBar: {
    height: 6,
    background: "#e0f2fe",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 12,
  },
  subjectTopicBarFill: { height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #06b6d4, #0891b2)" },
  subjectTopicAdvice: {
    fontSize: 13,
    color: "#666666",
    padding: "10px 14px",
    background: "#fff",
    borderRadius: 10,
    marginBottom: 14,
  },
  subjectTopicExercises: { marginTop: 8 },
  subjectTopicExercisesLabel: { fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 },
  exerciseChecklist: { display: "flex", flexDirection: "column", gap: 6 },
  exerciseCheckItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#374151" },
  checkbox: { fontSize: 14, color: "#94a3b8" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 12px",
  },
  strengthWeakness: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 24,
  },
  strengthCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  weaknessCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    fontWeight: 600,
    fontSize: 14,
  },
  cardIcon: { fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" },
  topicTags: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
  },
  topicTag: {
    padding: "6px 14px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 500,
  },
  noData: {
    fontSize: 12,
    color: "#94a3b8",
    margin: 0,
  },
  timeline: {
    borderLeft: "4px solid #0891b2",
    paddingLeft: 28,
    marginLeft: 12,
  },
  timelineItem: {
    position: "relative" as const,
    marginBottom: 28,
    animation: "fadeIn 0.3s ease",
    paddingLeft: 8,
  },
  timelineDot: {
    position: "absolute" as const,
    left: -34,
    top: 0,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #0891b2, #3b82f6)",
    border: "3px solid #fff",
    boxShadow: "0 0 0 3px #0891b2",
  },
  timelineWeek: {
    position: "absolute" as const,
    left: 20,
    top: -4,
    fontSize: 11,
    color: "#666666",
    fontWeight: 600,
  },
  timelineContent: {
    background: "#fff",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: 10,
  },
  timelineTopics: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    marginBottom: 10,
  },
  timelineTag: {
    padding: "5px 12px",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 500,
  },
  timelineTarget: {
    fontSize: 12,
    color: "#737373",
  },
  topicList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  topicDetailCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  topicDetailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  topicDetailName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#0f172a",
  },
  topicDetailSubject: {
    fontSize: 13,
    color: "#737373",
  },
  priorityBadge: {
    padding: "5px 14px",
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 600,
  },
  topicStats: {
    display: "flex",
    gap: 24,
    marginBottom: 12,
  },
  topicStat: {
    textAlign: "center" as const,
  },
  topicStatValue: {
    display: "block",
    fontSize: 18,
    fontWeight: 700,
    color: "#0891b2",
  },
  topicStatLabel: {
    fontSize: 11,
    color: "#737373",
  },
  accuracyBar: {
    height: 8,
    background: "#e0f2fe",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 12,
  },
  accuracyFill: {
    height: "100%",
    borderRadius: 99,
    transition: "width 0.4s ease",
    background: "linear-gradient(90deg, #06b6d4, #0891b2)",
  },
  topicAdvice: {
    fontSize: 13,
    color: "#666666",
    padding: "10px 14px",
    background: "#f8fafc",
    borderRadius: 10,
  },
  weekPlanList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  weekPlanCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  weekPlanHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  weekPlanNumber: {
    fontSize: 16,
    fontWeight: 700,
    color: "#3b82f6",
  },
  weekPlanTarget: {
    fontSize: 13,
    color: "#666666",
  },
  weekPlanFocus: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 12,
    lineHeight: 1.5,
  },
  weekPlanTopics: {
    marginBottom: 12,
  },
  weekPlanTopicsLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#737373",
    marginBottom: 8,
  },
  weekPlanTopicsList: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
  },
  weekPlanTopic: {
    padding: "6px 14px",
    borderRadius: 10,
    fontSize: 12,
    border: "1px solid",
    fontWeight: 500,
  },
  weekPlanDuration: {
    fontSize: 12,
    color: "#737373",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  exerciseGroup: {
    marginBottom: 24,
  },
  exerciseGroupHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 14,
    color: "#0f172a",
  },
  exerciseCard: {
    background: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  exerciseHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  exerciseSubject: {
    padding: "4px 12px",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
  },
  exerciseTopic: {
    fontSize: 14,
    fontWeight: 500,
    color: "#0f172a",
  },
  exerciseList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  exerciseItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    color: "#374151",
  },
  exerciseCheck: {
    fontSize: 14,
    color: "#94a3b8",
  },
  actionSection: {
    display: "flex",
    gap: 12,
    marginTop: 32,
    paddingBottom: 32,
  },
  primaryBtn: {
    flex: 1,
    padding: "16px 20px",
    background: "linear-gradient(135deg, #0891b2, #06b6d4)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    boxShadow: "0 4px 12px rgba(8, 145, 178, 0.3)",
    transition: "all 0.2s ease",
  },
  secondaryBtn: {
    flex: 1,
    padding: "16px 20px",
    background: "#fff",
    color: "#0891b2",
    border: "1.5px solid #0891b2",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    transition: "all 0.2s ease",
  },
};
