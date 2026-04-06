"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "../components/Icons";

interface ExamResult {
  id: string;
  studentId: string;
  subject: string;
  examName: string;
  score: number;
  maxScore: number;
  date: string;
  answers: any[];
  weakTopics: string[];
  strongTopics: string[];
  aiFeedback?: string;
}

interface SubjectStats {
  name: string;
  icon: string;
  color: string;
  attempts: number;
  bestScore: number;
  avgScore: number;
  latestScore: number;
  trend: "up" | "down" | "stable";
  history: { date: string; score: number }[];
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

const TRACK_SUBJECTS: Record<string, string[]> = {
  science: ["math", "physics", "chemistry", "english"],
  social: ["literature", "history", "geography", "civic", "english"],
  mixed: ["math", "literature", "english", "physics", "chemistry", "history", "geography", "civic"],
};

export default function ScoresPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "subjects">("overview");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

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

  const getSubjectStats = (subject: string): SubjectStats => {
    const subjectResults = results.filter(r => r.subject === subject);
    const info = SUBJECT_INFO[subject] || { name: subject, icon: "📚", color: "#64748b", track: [] };
    
    if (subjectResults.length === 0) {
      return {
        name: info.name,
        icon: info.icon,
        color: info.color,
        attempts: 0,
        bestScore: 0,
        avgScore: 0,
        latestScore: 0,
        trend: "stable",
        history: [],
      };
    }

    const scores = subjectResults.map(r => ({
      date: r.date,
      score: (r.score / r.maxScore) * 10,
    }));

    const avgScore = scores.reduce((s, c) => s + c.score, 0) / scores.length;
    const bestScore = Math.max(...scores.map(s => s.score));
    const latestScore = scores[scores.length - 1].score;
    
    let trend: "up" | "down" | "stable" = "stable";
    if (scores.length >= 2) {
      const recentAvg = scores.slice(-3).reduce((s, c) => s + c.score, 0) / Math.min(3, scores.length);
      const olderAvg = scores.slice(0, -3).reduce((s, c) => s + c.score, 0) / Math.max(1, scores.length - 3);
      if (recentAvg - olderAvg > 0.5) trend = "up";
      else if (olderAvg - recentAvg > 0.5) trend = "down";
    }

    return {
      name: info.name,
      icon: info.icon,
      color: info.color,
      attempts: subjectResults.length,
      bestScore,
      avgScore,
      latestScore,
      trend,
      history: scores,
    };
  };

  // Get subjects based on user's track
  const getSubjectsForTrack = () => {
    return Object.keys(SUBJECT_INFO).filter(subject => 
      SUBJECT_INFO[subject].track.includes(userTrack)
    );
  };

  const userTrack = profile?.track || "mixed";
  const trackSubjects = TRACK_SUBJECTS[userTrack] || TRACK_SUBJECTS.mixed;
  
  const trackResults = results.filter(r => trackSubjects.includes(r.subject));
  
  const overallStats = {
    totalExams: trackResults.length,
    avgScore: trackResults.length > 0 
      ? trackResults.reduce((s, r) => s + (r.score / r.maxScore) * 10, 0) / trackResults.length 
      : 0,
    avgScore30: 0,
    bestScore: trackResults.length > 0 
      ? Math.max(...trackResults.map(r => (r.score / r.maxScore) * 10))
      : 0,
    schoolTarget: profile?.targetSchoolScore || 7,
    uniTarget: profile?.targetUniScore || 18,
    trackSubjects: trackSubjects.length,
  };

  if (trackResults.length > 0) {
    overallStats.avgScore30 = (overallStats.avgScore / 10) * 30;
  }

  const getProgressColor = (score: number, target: number) => {
    const pct = (score / target) * 100;
    if (pct >= 100) return "linear-gradient(90deg, #0891b2, #06b6d4)";
    if (pct >= 80) return "linear-gradient(90deg, #0891b2, #22d3ee)";
    if (pct >= 50) return "linear-gradient(90deg, #f59e0b, #fbbf24)";
    return "linear-gradient(90deg, #ef4444, #f87171)";
  };

  const getTrackLabel = (track: string) => {
    const labels: Record<string, string> = {
      science: "Khối A/B (Tự nhiên)",
      social: "Khối C/D (Xã hội)",
      mixed: "Tất cả môn"
    };
    return labels[track] || track;
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

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.push("/dashboard")}>
          <Icons.Back /> Quay lại
        </button>
        <h1 style={styles.title}><Icons.Chart /> Bảng điểm & Phân tích</h1>
        <p style={styles.trackBadge}><Icons.Flag /> {getTrackLabel(userTrack)}</p>
      </div>

      {/* Target Progress */}
      <div style={styles.targetSection}>
        <div style={styles.targetCard}>
          <div style={styles.targetHeader}>
            <span style={styles.targetIcon}><Icons.School /></span>
            <div>
              <div style={styles.targetLabel}>Mục tiêu trường</div>
              <div style={styles.targetValue}>{overallStats.schoolTarget}/10</div>
            </div>
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${Math.min(100, (overallStats.avgScore / overallStats.schoolTarget) * 100)}%`,
                background: getProgressColor(overallStats.avgScore, overallStats.schoolTarget),
              }}
            />
          </div>
          <div style={styles.progressLabel}>
            Hiện tại: {overallStats.avgScore.toFixed(1)}/10 
            ({((overallStats.avgScore / overallStats.schoolTarget) * 100).toFixed(0)}%)
          </div>
        </div>

        <div style={styles.targetCard}>
          <div style={styles.targetHeader}>
            <span style={styles.targetIcon}><Icons.Graduation /></span>
            <div>
              <div style={styles.targetLabel}>Mục tiêu ĐH</div>
              <div style={styles.targetValue}>{overallStats.uniTarget}/10</div>
            </div>
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${Math.min(100, (overallStats.avgScore / overallStats.uniTarget) * 100)}%`,
                background: getProgressColor(overallStats.avgScore, overallStats.uniTarget),
              }}
            />
          </div>
          <div style={styles.progressLabel}>
            {overallStats.avgScore >= overallStats.uniTarget 
              ? "✓ Đạt mục tiêu!" 
              : `Cần thêm ${(overallStats.uniTarget - overallStats.avgScore).toFixed(1)} điểm`}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{overallStats.totalExams}</div>
          <div style={styles.statLabel}>Bài đã làm</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{overallStats.avgScore.toFixed(1)}</div>
          <div style={styles.statLabel}>Điểm TB</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{overallStats.bestScore.toFixed(1)}</div>
          <div style={styles.statLabel}>Điểm cao nhất</div>
        </div>
      </div>

      {/* Tabs - Segmented Control */}
      <div style={styles.tabs}>
        {[
          { key: "overview", label: "Tổng quan", icon: <Icons.ChartLine /> },
          { key: "subjects", label: "Theo môn", icon: <Icons.Book /> },
          { key: "history", label: "Lịch sử", icon: <Icons.History /> },
        ].map(tab => (
          <button
            key={tab.key}
            style={{
              ...styles.tab,
              background: activeTab === tab.key ? "#0891b2" : "transparent",
              color: activeTab === tab.key ? "#fff" : "#64748b",
              border: "none",
              boxShadow: activeTab === tab.key ? "0 2px 8px rgba(8, 145, 178, 0.3)" : "none",
            }}
            onClick={() => setActiveTab(tab.key as any)}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Phân tích theo môn ({getTrackLabel(userTrack)})</h3>
          <div style={styles.subjectList}>
            {getSubjectsForTrack().map(subject => {
              const stats = getSubjectStats(subject);
              const info = SUBJECT_INFO[subject];
              if (stats.attempts === 0) return null;
              return (
                <div 
                  key={subject} 
                  style={styles.subjectCard}
                  onClick={() => {
                    setSelectedSubject(subject);
                    setActiveTab("subjects");
                  }}
                >
                  <div style={{ ...styles.subjectIcon, background: stats.color + "20" }}>
                    {(() => {
                      const IconComponent = Icons[info.icon as keyof typeof Icons];
                      return IconComponent ? <span style={{ color: stats.color }}><IconComponent /></span> : null;
                    })()}
                  </div>
                  <div style={styles.subjectInfo}>
                    <div style={styles.subjectName}>{stats.name}</div>
                    <div style={styles.subjectAttempts}>{stats.attempts} lần thi</div>
                  </div>
                  <div style={styles.subjectScore}>
                    <div style={{ 
                      fontSize: 18, 
                      fontWeight: 700, 
                      color: stats.color 
                    }}>
                      {stats.avgScore.toFixed(1)}
                    </div>
                    <div style={{
                      ...styles.subjectBest,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}>
                      {stats.trend === "up" && <span style={{ color: "#10b981" }}>↑</span>}
                      {stats.trend === "down" && <span style={{ color: "#ef4444" }}>↓</span>}
                      So với lần trước
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {results.length === 0 && (
            <div style={styles.emptyState}>
              <span style={{ fontSize: 48, display: "flex" }}><Icons.Exam /></span>
              <p>Chưa có bài thi nào</p>
              <button style={styles.actionBtn} onClick={() => router.push("/exam")}>
                Làm bài kiểm tra
              </button>
            </div>
          )}
        </div>
      )}

      {/* Subjects Tab */}
      {activeTab === "subjects" && (
        <div style={styles.section}>
          {selectedSubject && SUBJECT_INFO[selectedSubject] && (
            <div style={styles.subjectDetail}>
              <div style={styles.subjectHeader}>
                <div style={{ ...styles.subjectIcon, background: SUBJECT_INFO[selectedSubject].color + "20", width: 56, height: 56 }}>
                  {(() => {
                    const IconComponent = Icons[SUBJECT_INFO[selectedSubject].icon as keyof typeof Icons];
                    return IconComponent ? <span style={{ color: SUBJECT_INFO[selectedSubject].color }}><IconComponent /></span> : null;
                  })()}
                </div>
                <div>
                  <h3 style={styles.sectionTitle}>{SUBJECT_INFO[selectedSubject].name}</h3>
                  <p style={styles.subjectAttempts}>
                    {getSubjectStats(selectedSubject).attempts} lần thi
                  </p>
                </div>
              </div>

              <div style={styles.subjectStats}>
                <div style={styles.subjectStatItem}>
                  <div style={styles.subjectStatValue}>
                    {getSubjectStats(selectedSubject).avgScore.toFixed(1)}
                  </div>
                  <div style={styles.subjectStatLabel}>Trung bình</div>
                </div>
                <div style={styles.subjectStatItem}>
                  <div style={styles.subjectStatValue}>
                    {getSubjectStats(selectedSubject).bestScore.toFixed(1)}
                  </div>
                  <div style={styles.subjectStatLabel}>Cao nhất</div>
                </div>
                <div style={styles.subjectStatItem}>
                  <div style={styles.subjectStatValue}>
                    {getSubjectStats(selectedSubject).latestScore.toFixed(1)}
                  </div>
                  <div style={styles.subjectStatLabel}>Lần gần nhất</div>
                </div>
              </div>

              {/* Mini Chart */}
              <div style={styles.miniChart}>
                <h4 style={styles.chartTitle}>Xu hướng điểm</h4>
                <div style={styles.chart}>
                  {getSubjectStats(selectedSubject).history.map((h, i) => (
                    <div key={i} style={styles.chartBar}>
                      <div 
                        style={{
                          ...styles.chartBarFill,
                          height: `${(h.score / 10) * 100}%`,
                          background: SUBJECT_INFO[selectedSubject]?.color || "#3b82f6",
                        }}
                      />
                      <div style={styles.chartLabel}>
                        {new Date(h.date).getDate()}/{new Date(h.date).getMonth() + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <h3 style={styles.sectionTitle}>Môn theo khối ({getTrackLabel(userTrack)})</h3>
          <div style={styles.subjectList}>
            {getSubjectsForTrack().map(subject => {
              const stats = getSubjectStats(subject);
              const info = SUBJECT_INFO[subject];
              return (
                <div 
                  key={subject} 
                  style={{
                    ...styles.subjectCard,
                    opacity: stats.attempts === 0 ? 0.5 : 1,
                  }}
                  onClick={() => stats.attempts > 0 && setSelectedSubject(subject)}
                >
                  <div style={{ ...styles.subjectIcon, background: stats.color + "20" }}>
                    {(() => {
                      const IconComponent = Icons[info.icon as keyof typeof Icons];
                      return IconComponent ? <span style={{ color: stats.color }}><IconComponent /></span> : null;
                    })()}
                  </div>
                  <div style={styles.subjectInfo}>
                    <div style={styles.subjectName}>{stats.name}</div>
                    <div style={styles.subjectAttempts}>
                      {stats.attempts > 0 ? `${stats.attempts} lần thi` : "Chưa thi"}
                    </div>
                  </div>
                  <div style={styles.subjectScore}>
                    {stats.attempts > 0 ? (
                      <>
                        <div style={{ fontSize: 18, fontWeight: 700, color: stats.color }}>
                          {stats.avgScore.toFixed(1)}
                        </div>
                        <div style={styles.subjectBest}>
                          Cao nhất: {stats.bestScore.toFixed(1)}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: 14 }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Lịch sử bài thi</h3>
          <div style={styles.historyList}>
            {[...results].reverse().map((result, i) => {
              const info = SUBJECT_INFO[result.subject] || { name: result.subject, icon: "Book", color: "#64748b" };
              const score = (result.score / result.maxScore) * 10;
              return (
                <div key={i} style={styles.historyItem}>
                  <div style={{ ...styles.historyIcon, background: info.color + "20" }}>
                    {(() => {
                      const IconComponent = Icons[info.icon as keyof typeof Icons];
                      return IconComponent ? <span style={{ color: info.color }}><IconComponent /></span> : null;
                    })()}
                  </div>
                  <div style={styles.historyInfo}>
                    <div style={styles.historyName}>{result.examName}</div>
                    <div style={styles.historyDate}>
                      {new Date(result.date).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div style={styles.historyScore}>
                    <div style={{ 
                      fontSize: 20, 
                      fontWeight: 700, 
                      color: score >= 5 ? "#059669" : "#dc2626" 
                    }}>
                      {score.toFixed(1)}
                    </div>
                    <div style={styles.historyMax}>/10</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {results.length === 0 && (
            <div style={styles.emptyState}>
              <span style={{ fontSize: 48 }}>📋</span>
              <p>Chưa có lịch sử bài thi</p>
            </div>
          )}
        </div>
      )}

      <div style={styles.actionSection}>
        <button style={styles.actionBtn} onClick={() => router.push("/exam")}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icons.Exam />
            <span>Làm bài kiểm tra mới</span>
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
  header: {
    marginBottom: 20,
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    color: "#0891b2",
    cursor: "pointer",
    padding: 0,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
  },
  trackBadge: {
    display: "inline-block",
    marginTop: 8,
    padding: "4px 12px",
    background: "linear-gradient(135deg, #e0f2fe, #cffafe)",
    borderRadius: 99,
    fontSize: 12,
    color: "#0891b2",
    fontWeight: 500,
  },
  targetSection: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginBottom: 20,
  },
  targetCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e0f2fe",
  },
  targetHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  targetIcon: {
    fontSize: 24,
  },
  targetLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  targetValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
  },
  progressBar: {
    height: 10,
    background: "#f0fdfa",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 10,
    border: "1px solid #e0f2fe",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
    transition: "width 0.3s, background 0.3s",
  },
  progressLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 18,
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e0f2fe",
  },
  statValue: {
    fontSize: 26,
    fontWeight: 800,
    color: "#0e7490",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    background: "#fff",
    padding: 6,
    borderRadius: 14,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  tab: {
    flex: 1,
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 14px",
  },
  subjectList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  subjectCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    display: "flex",
    alignItems: "center",
    gap: 14,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#0f172a",
  },
  subjectAttempts: {
    fontSize: 12,
    color: "#94a3b8",
  },
  subjectScore: {
    textAlign: "right",
  },
  subjectBest: {
    fontSize: 11,
    color: "#94a3b8",
  },
  subjectDetail: {
    background: "#fff",
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    border: "1px solid #f1f5f9",
  },
  subjectHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  subjectStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: 18,
  },
  subjectStatItem: {
    textAlign: "center",
    padding: 14,
    background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
    borderRadius: 14,
  },
  subjectStatValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0e7490",
    marginBottom: 4,
  },
  subjectStatLabel: {
    fontSize: 11,
    color: "#64748b",
  },
  miniChart: {
    marginTop: 18,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#64748b",
    marginBottom: 12,
  },
  chart: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    height: 80,
  },
  chartBar: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
  },
  chartBarFill: {
    width: "100%",
    borderRadius: "6px 6px 0 0",
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 6,
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  historyItem: {
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    display: "flex",
    alignItems: "center",
    gap: 14,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #f1f5f9",
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
  },
  historyDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  historyScore: {
    display: "flex",
    alignItems: "baseline",
    gap: 2,
  },
  historyMax: {
    fontSize: 12,
    color: "#94a3b8",
  },
  emptyState: {
    textAlign: "center",
    padding: 48,
    color: "#94a3b8",
    background: "#fff",
    borderRadius: 20,
  },
  actionSection: {
    marginTop: 24,
    textAlign: "center",
  },
  actionBtn: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #0891b2, #06b6d4)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(8, 145, 178, 0.4)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
};
