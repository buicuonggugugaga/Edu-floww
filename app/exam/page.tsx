"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "../components/Icons";

type SubjectId = "math" | "literature" | "english" | "physics" | "chemistry" | "history" | "geography" | "civic" | "biology" ;

interface SubjectConfig {
  id: SubjectId;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  questions: number;
  timeMinutes: number;
  type: "mcq" | "essay";
  group: "science" | "social" | "all";
}

const SUBJECTS: SubjectConfig[] = [
  { id: "math", name: "Toán", icon: <Icons.Math />, color: "#3b82f6", bgColor: "#eff6ff", questions: 60, timeMinutes: 90, type: "mcq", group: "all" },
  { id: "literature", name: "Ngữ Văn", icon: <Icons.Literature />, color: "#f59e0b", bgColor: "#fffbeb", questions: 50, timeMinutes: 90, type: "mcq", group: "all" },
  { id: "english", name: "Tiếng Anh", icon: <Icons.English />, color: "#10b981", bgColor: "#ecfdf5", questions: 50, timeMinutes: 60, type: "mcq", group: "all" },
  { id: "physics", name: "Vật Lý", icon: <Icons.Physics />, color: "#8b5cf6", bgColor: "#f5f3ff", questions: 40, timeMinutes: 75, type: "mcq", group: "science" },
  { id: "chemistry", name: "Hóa Học", icon: <Icons.Chemistry />, color: "#ef4444", bgColor: "#fef2f2", questions: 40, timeMinutes: 75, type: "mcq", group: "science" },
  { id: "history", name: "Lịch Sử", icon: <Icons.History />, color: "#6366f1", bgColor: "#eef2ff", questions: 40, timeMinutes: 75, type: "mcq", group: "social" },
  { id: "geography", name: "Địa Lý", icon: <Icons.Geography />, color: "#14b8a6", bgColor: "#f0fdfa", questions: 40, timeMinutes: 75, type: "mcq", group: "social" },
  { id: "civic", name: "GDCD", icon: <Icons.Civic />, color: "#f97316", bgColor: "#fff7ed", questions: 40, timeMinutes: 75, type: "mcq", group: "social" },
  { id: "biology", name: "Sinh", icon: <Icons.Biology />, color: "#22c55e", bgColor: "#f0fdf4", questions: 0, timeMinutes: 60, type: "mcq", group: "science" },
];

type ExamState = "subjects" | "intro" | "exam" | "result" | "overview";
type SubjectFilter = "all" | "science" | "social" | "completed";

interface Question {
  id: string;
  subject: string;
  topic: string;
  type: "mcq" | "short";
  prompt: string;
  choices: string[] | null;
}

interface ExamResult {
  subject: SubjectId;
  score: number;
  maxScore: number;
  correct: number;
  total: number;
  timeSpent: number;
  weakTopics: string[];
  strongTopics: string[];
  aiFeedback?: string;
}

export default function ExamPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [examState, setExamState] = useState<ExamState>("subjects");
  const [currentSubject, setCurrentSubject] = useState<SubjectConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ExamResult | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>("all");
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

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
        
        let studentGrade = 12;
        let studentTrack = "science";
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.profile);
          studentGrade = profileData.profile?.grade || 12;
          studentTrack = profileData.profile?.track || "science";
        }
        
        const configRes = await fetch("/api/exam/config", { credentials: "include" });
        if (configRes.ok) {
          const configData = await configRes.json();
          const counts: Record<string, number> = {};
          configData.subjects.forEach((s: any) => {
            counts[s.id] = s.questionCount;
          });
          setQuestionCounts(counts);
        }
      } catch (e) {
        console.error("Auth error:", e);
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timerActive, timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const getAvailableSubjects = useCallback(() => {
    if (subjectFilter === "completed") {
      return SUBJECTS.filter(s => isCompleted(s.id));
    }
    if (subjectFilter === "science") {
      return SUBJECTS.filter(s => s.group === "all" || s.group === "science");
    }
    if (subjectFilter === "social") {
      return SUBJECTS.filter(s => s.group === "all" || s.group === "social");
    }
    return SUBJECTS;
  }, [subjectFilter, results]);

  const getCompletedSubjects = () => results.map(r => r.subject);
  const isCompleted = (id: SubjectId) => results.some(r => r.subject === id);
  const getSubjectResult = (id: SubjectId) => results.find(r => r.subject === id);

  const startExam = async (subject: SubjectConfig) => {
    setError(null);
    setCurrentSubject(subject);
    setAnswers({});
    setCurrentQ(0);
    setLoading(true);
    
    try {
      const res = await fetch(`/api/exam?subject=${subject.id}&mode=subject`, { credentials: "include" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Lỗi tạo đề");
      setQuestions(data.questions || []);
      setTimeLeft(subject.timeMinutes * 60);
      setExamState("intro");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const beginExam = () => {
    setTimerActive(true);
    setExamState("exam");
  };

  const handleSubmit = async () => {
    if (!currentSubject || submitting) return;
    setSubmitting(true);
    setTimerActive(false);
    
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject: currentSubject.id,
          mode: "single",
          track: profile?.track || "mixed",
          examName: `Bài thi ${currentSubject.name}`,
          answers,
        }),
      });
      const data = await res.json();
      
      const result: ExamResult = {
        subject: currentSubject.id as SubjectId,
        score: data.result?.score || 0,
        maxScore: data.result?.maxScore || currentSubject.questions,
        correct: data.result?.answers?.filter((a: any) => a.isCorrect).length || 0,
        total: questions.length,
        timeSpent: currentSubject.timeMinutes * 60 - timeLeft,
        weakTopics: data.analysis?.weakTopics || [],
        strongTopics: data.analysis?.strongTopics || [],
        aiFeedback: data.analysis?.feedback || data.result?.aiFeedback || "",
      };
      
      setResults(prev => [...prev.filter(r => r.subject !== currentSubject.id), result]);
      setLastResult(result);
      setExamState("result");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const continueToSubjects = () => {
    setCurrentSubject(null);
    setQuestions([]);
    setAnswers({});
    setLastResult(null);
    setError(null);
    setExamState("subjects");
  };

  const getAvgScore = () => {
    if (results.length === 0) return 0;
    return results.reduce((s, r) => s + (r.score / r.maxScore) * 10, 0) / results.length;
  };

  const getLevel = (avg: number) => {
    if (avg >= 9) return "Xuất sắc";
    if (avg >= 8) return "Giỏi";
    if (avg >= 7) return "Khá";
    if (avg >= 5) return "Trung bình";
    return "Cần cố gắng hơn";
  };

  if (authLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Đang tải...</p>
      </div>
    );
  }

  // SUBJECT SELECTION
  if (examState === "subjects") {
    const subjects = getAvailableSubjects();
    const completed = getCompletedSubjects();
    const allDone = completed.length === subjects.length && subjects.length > 0;

    return (
      <div style={styles.container}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <button style={styles.backBtn} onClick={() => router.push("/dashboard")}>
              <Icons.Back />
            </button>
            <h1 style={styles.title}><Icons.Exam /> Kỳ thi THPT</h1>
          </div>
          <p style={styles.subtitle}>Lớp {profile?.grade} · {profile?.track === "science" ? "Khối Tự nhiên" : profile?.track === "social" ? "Khối Xã hội" : "Tổng hợp"}</p>
        </div>

        {/* Filter */}
        <div style={styles.filterContainer}>
          <div style={styles.filterTabs}>
            {[
              { key: "all" as SubjectFilter, label: "Tất cả", icon: <Icons.Grid /> },
              { key: "science" as SubjectFilter, label: "Tự nhiên", icon: <Icons.Physics /> },
              { key: "social" as SubjectFilter, label: "Xã hội", icon: <Icons.Literature /> },
              { key: "completed" as SubjectFilter, label: "Đã làm", icon: <Icons.Check /> },
            ].map(f => (
              <button
                key={f.key}
                style={{
                  ...styles.filterTab,
                  background: subjectFilter === f.key ? "#3b82f6" : "#fff",
                  color: subjectFilter === f.key ? "#fff" : "#64748b",
                  borderColor: subjectFilter === f.key ? "#3b82f6" : "#e2e8f0",
                }}
                onClick={() => setSubjectFilter(f.key)}
              >
                <span style={{ marginRight: 4, display: "flex", alignItems: "center" }}>{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.progressCard}>
          <div style={{ flex: 1 }}>
            <div style={styles.progressText}>Tiến độ: {completed.length}/{SUBJECTS.length} môn đã làm</div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${(completed.length / SUBJECTS.length) * 100}%` }} />
            </div>
          </div>
          <div style={styles.progressPercent}>{Math.round((completed.length / SUBJECTS.length) * 100)}%</div>
        </div>

        {allDone && (
          <div style={styles.completeCard}>
            <span style={{ fontSize: 48, display: "flex" }}><Icons.Trophy /></span>
            <h2>Hoàn thành kỳ thi!</h2>
            <p>Điểm TB: <strong>{getAvgScore().toFixed(1)}</strong>/10 - {getLevel(getAvgScore())}</p>
            <button style={styles.overviewBtn} onClick={() => setExamState("overview")}>
              Xem đánh giá tổng quát →
            </button>
          </div>
        )}

        {subjects.length === 0 && (
          <div style={styles.emptyCard}>
            <span style={{ fontSize: 48, display: "flex" }}><Icons.File /></span>
            <p>Không có môn nào trong danh mục này</p>
          </div>
        )}

        <div style={styles.grid}>
          {subjects.map(s => {
            const done = isCompleted(s.id);
            const r = getSubjectResult(s.id);
            const actualCount = questionCounts[s.id] ?? s.questions;
            return (
              <div 
                key={s.id} 
                style={{ ...styles.card }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
                }}
              >
                <div style={{ ...styles.cardIcon, background: s.bgColor, color: s.color }}>
                  {done ? <Icons.Check /> : s.icon}
                </div>
                <h3 style={styles.cardTitle}>{s.name}</h3>
                <p style={styles.cardInfo}>{actualCount} câu · {s.timeMinutes} phút</p>
                {r && (
                  <div style={styles.cardScore}>
                    <span style={{ color: (r.score / r.maxScore) * 10 >= 5 ? "#10b981" : "#ef4444", fontSize: 22, fontWeight: 700 }}>
                      {((r.score / r.maxScore) * 10).toFixed(1)}
                    </span>
                    <span style={{ color: "#94a3b8", fontSize: 14 }}>/10</span>
                  </div>
                )}
                <button 
                  style={{ ...styles.cardBtn, borderColor: s.color, color: s.color }} 
                  onClick={() => startExam(s)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = s.color;
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = s.color;
                  }}
                >
                  {done ? "Làm lại" : "Bắt đầu"}
                </button>
              </div>
            );
          })}
        </div>

        {error && <div style={styles.error}>⚠ {error}</div>}
      </div>
    );
  }

  // INTRO
  if (examState === "intro" && currentSubject) {
    return (
      <div style={styles.container}>
        <div style={styles.introCard}>
          <div style={{ ...styles.introIcon, background: currentSubject.bgColor, color: currentSubject.color }}>{currentSubject.icon}</div>
          <h2 style={styles.introTitle}>Bài thi {currentSubject.name}</h2>
          <div style={styles.introStats}>
            <div style={styles.introStat}>
              <span style={styles.introStatVal}>{currentSubject.type === "essay" ? "1 bài" : `${questions.length || currentSubject.questions} câu`}</span>
              <span style={styles.introStatLabel}>{currentSubject.type === "essay" ? "Tự luận" : "Trắc nghiệm"}</span>
            </div>
            <div style={styles.introStat}>
              <span style={styles.introStatVal}>{currentSubject.timeMinutes}</span>
              <span style={styles.introStatLabel}>Phút</span>
            </div>
          </div>
          <div style={styles.introWarning}><Icons.Warning /> Không tải lại trang. Thời gian bắt đầu khi bạn nhấn "Bắt đầu".</div>
          <div style={styles.introBtns}>
            <button style={styles.backBtn} onClick={() => { setCurrentSubject(null); setExamState("subjects"); }}><Icons.Back /> Quay lại</button>
            <button style={{ ...styles.startBtn, background: currentSubject.color }} onClick={beginExam}>Bắt đầu làm bài →</button>
          </div>
        </div>
      </div>
    );
  }

  // EXAM
  if (examState === "exam" && currentSubject) {
    const q = questions[currentQ];
    const answered = Object.keys(answers).length;
    const progress = questions.length ? (answered / questions.length) * 100 : 0;
    const isLow = timeLeft < 300;

    return (
      <div style={styles.examContainer}>
        <div style={styles.examHeader}>
          <span style={{ fontSize: 20 }}>{currentSubject.icon}</span>
          <span style={styles.examTitle}>{currentSubject.name}</span>
          <span style={{ ...styles.timer, color: isLow ? "#ef4444" : "#374151" }}><Icons.Timer /> {formatTime(timeLeft)}</span>
        </div>
        
        <div style={styles.examProgress}>
          <span style={{ fontSize: 12, color: "#64748b" }}>{answered}/{questions.length} câu</span>
          <div style={styles.examProgressTrack}>
            <div style={{ ...styles.examProgressFill, width: `${progress}%`, background: currentSubject.color }} />
          </div>
        </div>

        <div style={styles.examBody}>
          {q && (
            <div style={styles.questionCard}>
              <div style={styles.qHeader}>
                <span style={{ ...styles.qBadge, background: currentSubject.bgColor, color: currentSubject.color }}>Câu {currentQ + 1}</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{q.topic}</span>
              </div>
              <p style={styles.qPrompt}>{q.prompt}</p>
              
              {q.type === "mcq" && q.choices ? (
                <div style={styles.choices}>
                  {q.choices.map((c, i) => {
                    const sel = answers[q.id] === c;
                    return (
                      <button key={i} style={{ ...styles.choice, borderColor: sel ? currentSubject.color : "#e2e8f0", background: sel ? currentSubject.bgColor : "#fff" }} onClick={() => setAnswers(p => ({ ...p, [q.id]: c }))}>
                        <span style={{ ...styles.choiceLetter, background: sel ? currentSubject.color : "#f1f5f9", color: sel ? "#fff" : "#64748b" }}>{String.fromCharCode(65 + i)}</span>
                        <span style={{ color: sel ? currentSubject.color : "#374151" }}>{c}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea style={styles.textarea} value={answers[q.id] || ""} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))} placeholder="Nhập câu trả lời..." />
              )}
            </div>
          )}

          <div style={styles.nav}>
            <button style={styles.navBtn} onClick={() => setCurrentQ(p => Math.max(0, p - 1))} disabled={currentQ === 0}>← Trước</button>
            {currentQ < questions.length - 1 ? (
              <button style={{ ...styles.navBtn, background: currentSubject.color, color: "#fff", border: "none" }} onClick={() => setCurrentQ(p => p + 1)}>Tiếp →</button>
            ) : (
              <button style={{ ...styles.navBtn, background: "#10b981", color: "#fff", border: "none" }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Đang nộp..." : <><Icons.Check /> Nộp bài</>}
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator - Horizontal */}
        <div style={styles.navigatorHorizontal}>
          {questions.map((qq, i) => {
            const answered = !!answers[qq.id];
            const active = i === currentQ;
            return (
              <button
                key={qq.id}
                onClick={() => setCurrentQ(i)}
                style={{
                  width: 44,
                  height: 40,
                  borderRadius: 8,
                  border: `1.5px solid ${active ? currentSubject.color : answered ? '#10b981' : '#e2e8f0'}`,
                  background: active ? currentSubject.bgColor : answered ? '#ecfdf5' : '#fff',
                  color: active ? currentSubject.color : answered ? '#059669' : '#94a3b8',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginRight: 6,
                  marginBottom: 6,
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // RESULT
  if (examState === "result" && lastResult && currentSubject) {
    const score = (lastResult.score / lastResult.maxScore) * 10;
    return (
      <div style={styles.container}>
        <div style={styles.resultCard}>
          <div style={{ ...styles.resultIcon, background: score >= 5 ? "#ecfdf5" : "#fef2f2" }}>
            {score >= 5 ? <Icons.Trophy /> : <Icons.Book />}
          </div>
          <h2>Kết quả bài thi {currentSubject.name}</h2>
          <div style={styles.resultScore}>
            <span style={{ color: score >= 5 ? "#10b981" : "#ef4444", fontSize: 48, fontWeight: 800 }}>{score.toFixed(1)}</span>
            <span style={{ fontSize: 20, color: "#94a3b8" }}>/10</span>
          </div>
          <p style={{ color: "#64748b" }}>{lastResult.correct}/{lastResult.total} câu đúng</p>
          {lastResult.aiFeedback && (
            <div style={{ marginTop: 16, padding: 16, background: "#f0f9ff", borderRadius: 12, maxWidth: 400, textAlign: "left" }}>
              <p style={{ fontSize: 13, color: "#0369a1", margin: 0 }}><strong>📝 Nhận xét từ AI:</strong></p>
              <p style={{ fontSize: 13, color: "#0c4a6e", margin: "8px 0 0" }}>{lastResult.aiFeedback}</p>
            </div>
          )}
          <button style={styles.continueBtn} onClick={continueToSubjects}>Tiếp tục</button>
        </div>
      </div>
    );
  }

  // OVERVIEW
  if (examState === "overview") {
    const avg = getAvgScore();
    return (
      <div style={styles.container}>
        <div style={styles.overviewHeader}>
          <h1><Icons.Chart /> Đánh giá tổng quát</h1>
          <p style={{ color: "#64748b" }}>Kết quả sau khi hoàn thành kỳ thi</p>
        </div>

        <div style={styles.avgCard}>
          <div style={{ fontSize: 64, fontWeight: 800 }}>{avg.toFixed(1)}</div>
          <div style={{ fontSize: 16, opacity: 0.9 }}>/10 trung bình · {getLevel(avg)}</div>
        </div>

        <div style={styles.resultGrid}>
          {results.map(r => {
            const s = SUBJECTS.find(sub => sub.id === r.subject);
            const sc = (r.score / r.maxScore) * 10;
            return (
              <div key={r.subject} style={styles.resultItem}>
                <span style={{ fontSize: 24, color: s?.color, display: "flex" }}>{s?.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{s?.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.correct}/{r.total} câu đúng</div>
                </div>
                <span style={{ fontSize: 20, fontWeight: 700, color: sc >= 5 ? "#10b981" : "#ef4444" }}>{sc.toFixed(1)}</span>
              </div>
            );
          })}
        </div>

        <div style={styles.analysisCard}>
          <h3>Phân tích</h3>
          <p><strong>Môn mạnh nhất:</strong> {results.sort((a, b) => (b.score / b.maxScore) - (a.score / a.maxScore))[0] ? SUBJECTS.find(s => s.id === results.sort((a, b) => (b.score / b.maxScore) - (a.score / a.maxScore))[0].subject)?.name : "—"}</p>
          <p><strong>Môn yếu nhất:</strong> {results.sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore))[0] ? SUBJECTS.find(s => s.id === results.sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore))[0].subject)?.name : "—"}</p>
          {lastResult?.aiFeedback && (
            <div style={{ marginTop: 16, padding: 16, background: "#f0f9ff", borderRadius: 12 }}>
              <p style={{ fontSize: 14, color: "#0369a1", margin: 0 }}><strong>📝 Nhận xét từ AI:</strong></p>
              <p style={{ fontSize: 14, color: "#0c4a6e", margin: "8px 0 0" }}>{lastResult.aiFeedback}</p>
            </div>
          )}
          <p style={{ marginTop: 12 }}><strong>Khuyến nghị:</strong> {avg >= 7 ? "Bạn đã sẵn sàng cho kỳ thi THPT!" : "Cần ôn tập thêm để cải thiện điểm số."}</p>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
          <button style={styles.backBtn} onClick={continueToSubjects}>Làm lại bài thi</button>
          <button style={{ ...styles.startBtn, background: "#3b82f6" }} onClick={() => router.push("/dashboard")}>Quay về Dashboard →</button>
        </div>
      </div>
    );
  }

  return null;
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", background: "#F4F7F6", padding: "24px 20px", fontFamily: "'Roboto', sans-serif" },
  loading: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#F4F7F6" },
  spinner: { width: 48, height: 48, borderRadius: "50%", border: "3px solid #e2e8f0", borderTop: "3px solid #0891b2", animation: "spin 1s linear infinite" },
  header: { marginBottom: 20 },
  titleRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 },
  subtitle: { fontSize: 14, color: "#64748b", margin: 0 },
  filterContainer: { marginBottom: 24 },
  filterTabs: { display: "flex", gap: 8, flexWrap: "wrap" },
  filterTab: { padding: "10px 18px", borderRadius: 24, border: "1.5px solid", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: 6 },
  emptyCard: { background: "#fff", borderRadius: 20, padding: 48, textAlign: "center", marginBottom: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" },
  progressCard: { background: "#fff", borderRadius: 16, padding: 20, marginBottom: 32, boxShadow: "0 4px 16px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 20 },
  progressText: { fontSize: 14, color: "#64748b", marginBottom: 10, fontWeight: 500 },
  progressTrack: { height: 12, background: "#e0f2fe", borderRadius: 99, overflow: "hidden", flex: 1, position: "relative" as const },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #06b6d4, #0891b2, #3b82f6)", borderRadius: 99, transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" },
  progressPercent: { fontSize: 16, fontWeight: 700, color: "#0891b2", minWidth: 50, textAlign: "right" as const },
  completeCard: { background: "linear-gradient(135deg, #0891b2, #06b6d4)", borderRadius: 20, padding: 28, marginBottom: 24, textAlign: "center", color: "#fff", boxShadow: "0 8px 24px rgba(8, 145, 178, 0.3)" },
  overviewBtn: { background: "#fff", color: "#0891b2", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 12, transition: "all 0.2s ease" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 },
  card: { background: "#fff", borderRadius: 18, padding: 24, textAlign: "center", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", transition: "all 0.25s ease", position: "relative" as const, overflow: "hidden" as const },
  cardIcon: { width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" },
  cardInfo: { fontSize: 13, color: "#94a3b8", margin: "0 0 16px", opacity: 0.8 },
  cardScore: { marginBottom: 16 },
  cardBtn: { width: "100%", padding: "12px 16px", border: "1.5px solid", borderRadius: 12, background: "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" },
  error: { background: "#fef2f2", borderRadius: 12, padding: "14px 18px", color: "#dc2626", fontSize: 14, marginTop: 16, textAlign: "center", border: "1px solid #fecaca" },
  introCard: { background: "#fff", borderRadius: 24, padding: 40, textAlign: "center", maxWidth: 500, margin: "60px auto", boxShadow: "0 12px 40px rgba(0,0,0,0.1)", border: "1px solid rgba(0,0,0,0.04)" },
  introIcon: { width: 88, height: 88, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, margin: "0 auto 24px" },
  introTitle: { fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 24px" },
  introStats: { display: "flex", justifyContent: "center", gap: 40, marginBottom: 28 },
  introStat: { textAlign: "center" },
  introStatVal: { display: "block", fontSize: 28, fontWeight: 700, color: "#0891b2" },
  introStatLabel: { fontSize: 12, color: "#94a3b8" },
  introWarning: { background: "linear-gradient(135deg, #fef3c7, #fde68a)", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "#92400e", marginBottom: 24, border: "1px solid #fcd34d" },
  introBtns: { display: "flex", gap: 12, justifyContent: "center" },
  backBtn: { background: "none", border: "none", color: "#0891b2", fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 },
  startBtn: { padding: "14px 28px", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  examContainer: { minHeight: "100vh", background: "#F4F7F6", fontFamily: "'Roboto', sans-serif" },
  examHeader: { background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 10 },
  examTitle: { fontSize: 16, fontWeight: 600, color: "#0f172a", flex: 1 },
  timer: { fontSize: 18, fontWeight: 700, color: "#0891b2" },
  examProgress: { background: "#fff", padding: "8px 20px 12px", borderBottom: "1px solid rgba(0,0,0,0.05)" },
  examProgressTrack: { height: 6, background: "#e0f2fe", borderRadius: 99, overflow: "hidden", marginTop: 6 },
  examProgressFill: { height: "100%", borderRadius: 99, transition: "width 0.3s", background: "linear-gradient(90deg, #06b6d4, #0891b2, #3b82f6)" },
  examBody: { maxWidth: 800, margin: "0 auto", padding: "24px 20px 130px" },
  questionCard: { background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", marginBottom: 20, border: "1px solid rgba(0,0,0,0.04)" },
  qHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  qBadge: { fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99 },
  qPrompt: { fontSize: 16, fontWeight: 500, color: "#0f172a", lineHeight: 1.6, marginBottom: 20 },
  choices: { display: "flex", flexDirection: "column", gap: 10 },
  choice: { display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 14, border: "1.5px solid #e0f2fe", background: "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s" },
  choiceLetter: { width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 },
  textarea: { width: "100%", minHeight: 150, padding: 14, border: "1.5px solid #e0f2fe", borderRadius: 14, fontSize: 15, fontFamily: "inherit", resize: "vertical" },
  nav: { display: "flex", gap: 12 },
  navBtn: { flex: 1, padding: 14, borderRadius: 14, border: "1.5px solid #e0f2fe", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" },
  navigatorHorizontal: { 
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(10px)",
    borderTop: "1px solid rgba(0,0,0,0.05)", 
    padding: "12px 16px", 
    position: "fixed", 
    bottom: 0, 
    left: 0, 
    right: 0,
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    maxHeight: 110,
    overflowY: "auto",
    zIndex: 20,
  },
  resultCard: { background: "#fff", borderRadius: 24, padding: 40, textAlign: "center", maxWidth: 500, margin: "60px auto", boxShadow: "0 12px 40px rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.04)" },
  resultIcon: { width: 88, height: 88, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, margin: "0 auto 20px" },
  resultScore: { margin: "16px 0" },
  continueBtn: { padding: "14px 32px", border: "none", borderRadius: 12, background: "linear-gradient(135deg, #0891b2, #06b6d4)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(8, 145, 178, 0.3)", transition: "all 0.2s ease" },
  overviewHeader: { textAlign: "center", marginBottom: 24 },
  avgCard: { textAlign: "center", background: "linear-gradient(135deg, #0891b2, #06b6d4)", borderRadius: 24, padding: 32, marginBottom: 24, color: "#fff", boxShadow: "0 8px 24px rgba(8, 145, 178, 0.3)" },
  resultGrid: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 },
  resultItem: { background: "#fff", borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" },
  analysisCard: { background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" },
};
