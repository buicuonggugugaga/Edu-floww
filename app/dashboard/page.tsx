"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import MainLayout from "../components/MainLayout";
import { Icons } from "../components/Icons";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: "inspiration" | "tips" | "motivation" | "success";
  readTime: string;
  icon: string;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: "10 phương pháp học tập hiệu quả được khoa học chứng minh",
    excerpt: "Từ kỹ thuật Pomodoro đến Spaced Repetition - khám phá những cách học thông minh giúp bạn tiếp thu kiến thức nhanh hơn.",
    category: "tips",
    readTime: "5 phút",
    icon: "Lightbulb",
  },
  {
    id: 2,
    title: "Từ 6 điểm lên 9 điểm trong 3 tháng: Hành trình của Minh",
    excerpt: "Chia sẻ kinh nghiệm thực tế từ một học sinh đã vượt qua khó khăn và cải thiện điểm số đáng kể.",
    category: "success",
    readTime: "7 phút",
    icon: "TrendUp",
  },
  {
    id: 3,
    title: "Tại sao thất bại lại là bước đệm cho thành công?",
    excerpt: "Những vấp ngã trong học tập không phải là dấu chấm hết, mà là cơ hội để bạn mạnh mẽ hơn.",
    category: "inspiration",
    readTime: "4 phút",
    icon: "Fire",
  },
  {
    id: 4,
    title: "Quản lý thời gian hiệu quả cho học sinh THPT",
    excerpt: "Làm thế nào để cân bằng giữa học tập, thi cử và cuộc sống cá nhân một cách khoa học?",
    category: "tips",
    readTime: "6 phút",
    icon: "Timer",
  },
  {
    id: 5,
    title: "Bạn có biết: Não bộ học tốt nhất vào lúc nào?",
    excerpt: "Nghiên cứu khoa học chỉ ra thời điểm vàng để học tập và ghi nhớ kiến thức hiệu quả nhất.",
    category: "tips",
    readTime: "4 phút",
    icon: "Brain",
  },
  {
    id: 6,
    title: "Những thói quen của học sinh xuất sắc",
    excerpt: "Tìm hiểu bí quyết học tập từ các thủ khoa kỳ thi THPTQG những năm qua.",
    category: "success",
    readTime: "8 phút",
    icon: "Trophy",
  },
];

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  subject?: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [showTodoInput, setShowTodoInput] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkAuth = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include"
        });

        if (!isMounted) return;

        if (sessionRes.status === 401) {
          router.push("/login");
          return;
        }

        const sessionData = await sessionRes.json();
        
        if (!isMounted) return;

        if (sessionData.hasProfile) {
          const res = await fetch("/api/student", {
            credentials: "include"
          });
          
          if (!isMounted) return;
          
          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              setProfile(data.profile);
            }
          }
        } else {
          router.push("/onboarding");
          return;
        }
      } catch (e) {
        if (isMounted) {
          router.push("/login");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      if (!isMounted) return;
      if (!user) {
        router.push("/login");
      }
    });

    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        router.push("/login");
      }
    }, 10000);

    return () => {
      isMounted = false;
      unsub();
      clearTimeout(timeoutId);
    };
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem("study_todos");
    if (saved) {
      setTodos(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("study_todos", JSON.stringify(todos));
  }, [todos]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut(firebaseAuth);
    } catch (e) {}
    try {
      await fetch("/api/auth/session", { 
        method: "DELETE",
        credentials: "include"
      });
    } catch (e) {}
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    window.location.href = "/login";
  }

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      completed: false,
      priority: "medium",
      createdAt: new Date().toISOString(),
    };
    setTodos([todo, ...todos]);
    setNewTodo("");
    setShowTodoInput(false);
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  if (loading) {
    return (
      <div style={S.loading}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes gradientFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`}</style>
        <div style={S.spinner} />
        <p style={{ color: "#94a3b8", fontSize: 14 }}>Đang tải...</p>
      </div>
    );
  }

  const exams = profile?.examResults ?? [];
  const userTrack = profile?.track || "mixed";
  
  const TRACK_SUBJECTS: Record<string, string[]> = {
    science: ["math", "physics", "chemistry", "english"],
    social: ["literature", "history", "geography", "civic", "english"],
    mixed: ["math", "literature", "english", "physics", "chemistry", "history", "geography", "civic"],
  };
  
  const trackSubjects = TRACK_SUBJECTS[userTrack] || TRACK_SUBJECTS.mixed;
  const trackExams = exams.filter((r: any) => trackSubjects.includes(r.subject));
  
  const avgScore = trackExams.length > 0
    ? (trackExams.reduce((s: number, r: any) => s + (r.score / r.maxScore) * 10, 0) / trackExams.length)
    : null;
  
  const avgScore30 = avgScore !== null ? (avgScore * 3).toFixed(1) : null;
  const schoolTarget = profile?.targetSchoolScore ?? 7;
  const uniTarget = profile?.targetUniScore ?? 18;

  const pendingTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);
  const trackLabel = userTrack === "science" ? "Khối A/B" : userTrack === "social" ? "Khối C/D" : "Tất cả môn";

  return (
    <MainLayout 
      userName={profile?.name} 
      userGrade={profile?.grade}
      onLogout={handleLogout}
    >
      <div style={S.pageWrapper}>
        {/* Welcome Banner - Compact */}
        <div style={S.welcomeBanner}>
          <div style={S.welcomeBannerInner}>
            <div style={S.welcomeContent}>
              <h1 style={S.welcomeTitle}>
                Hello, <span style={S.highlightName}>{profile?.name ?? "bạn"}</span>
              </h1>
              <p style={S.welcomeSubtitle}>
                {trackLabel} · {profile?.school} · Lớp {profile?.grade}
              </p>
            </div>
          </div>
        </div>

        {/* Floating Stats Cards - Overlap between green and white */}
        <div style={S.floatingStatsContainer}>
          <div style={S.floatingStats}>
            <div style={S.statCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
              }}
            >
              <div style={{...S.statIconWrap, background: "linear-gradient(135deg, #0891b2, #06b6d4)"}}>
                <Icons.Exam />
              </div>
              <div style={S.statContent}>
                <span style={S.statNum}>{trackExams.length}</span>
                <span style={S.statLabel}>Bài kiểm tra</span>
              </div>
            </div>
            <div style={S.statCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
              }}
            >
              <div style={{...S.statIconWrap, background: "linear-gradient(135deg, #059669, #10b981)"}}>
                <Icons.Chart />
              </div>
              <div style={S.statContent}>
                <span style={S.statNum}>{avgScore !== null ? avgScore.toFixed(1) : "—"}</span>
                <span style={S.statLabel}>Điểm TB (10)</span>
              </div>
            </div>
            <div style={S.statCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
              }}
            >
              <div style={{...S.statIconWrap, background: "linear-gradient(135deg, #7c3aed, #a855f7)"}}>
                <Icons.TrendUp />
              </div>
              <div style={S.statContent}>
                <span style={S.statNum}>{avgScore30 ?? "—"}</span>
                <span style={S.statLabel}>Điểm TB (30)</span>
              </div>
            </div>
            <div style={S.statCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
              }}
            >
              <div style={{...S.statIconWrap, background: "linear-gradient(135deg, #ea580c, #f97316)"}}>
                <Icons.Clock />
              </div>
              <div style={S.statContent}>
                <span style={S.statNum}>{pendingTodos.length}</span>
                <span style={S.statLabel}>Việc đang chờ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={S.mainContent}>
          {/* Left Column */}
          <div style={S.leftCol}>
            {/* Quick Actions */}
            <section style={S.section}>
              <h2 style={S.sectionTitle}>Hành động nhanh</h2>
              <div style={S.actionGrid}>
                <a 
                  href="/exam" 
                  style={S.actionCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(8, 145, 178, 0.2)";
                    e.currentTarget.style.borderColor = "#0891b2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.06)";
                    e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.04)";
                  }}
                >
                  <div style={{...S.actionIcon, background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)"}}>
                    <Icons.Exam />
                  </div>
                  <div style={S.actionInfo}>
                    <h3 style={S.actionTitle}>Làm bài kiểm tra</h3>
                    <p style={S.actionDesc}>Đánh giá năng lực hiện tại</p>
                  </div>
                  <div style={S.actionArrow}><Icons.ArrowRight /></div>
                </a>

                <a 
                  href="/roadmap" 
                  style={S.actionCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(5, 150, 105, 0.2)";
                    e.currentTarget.style.borderColor = "#059669";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.06)";
                    e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.04)";
                  }}
                >
                  <div style={{...S.actionIcon, background: "linear-gradient(135deg, #059669 0%, #10b981 100%)"}}>
                    <Icons.Roadmap />
                  </div>
                  <div style={S.actionInfo}>
                    <h3 style={S.actionTitle}>Xem lộ trình</h3>
                    <p style={S.actionDesc}>Kế hoạch học cá nhân hóa</p>
                  </div>
                  <div style={S.actionArrow}><Icons.ArrowRight /></div>
                </a>

                <a 
                  href="/scores" 
                  style={S.actionCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(124, 58, 237, 0.2)";
                    e.currentTarget.style.borderColor = "#7c3aed";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.06)";
                    e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.04)";
                  }}
                >
                  <div style={{...S.actionIcon, background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"}}>
                    <Icons.Chart />
                  </div>
                  <div style={S.actionInfo}>
                    <h3 style={S.actionTitle}>Xem điểm số</h3>
                    <p style={S.actionDesc}>Theo dõi tiến độ học tập</p>
                  </div>
                  <div style={S.actionArrow}><Icons.ArrowRight /></div>
                </a>
              </div>
            </section>

            {/* Goals Progress */}
            <section style={S.section}>
              <h2 style={S.sectionTitle}>Mục tiêu của bạn</h2>
              <div style={S.goalsGrid}>
                <div 
                  style={S.goalCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 16px 40px rgba(0, 0, 0, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.06)";
                  }}
                >
                  <div style={S.goalHeader}>
                    <div style={S.goalIconWrap}>
                      <span style={S.goalIcon}><Icons.School /></span>
                    </div>
                    <div>
                      <p style={S.goalLabel}>Mục tiêu trường</p>
                      <p style={S.goalValue}>{schoolTarget}/10 điểm</p>
                    </div>
                  </div>
                  <div style={S.progressTrack}>
                    <div style={{
                      ...S.progressBar,
                      width: `${avgScore !== null ? Math.min(100, (avgScore / schoolTarget) * 100) : 0}%`,
                      background: avgScore !== null && avgScore >= schoolTarget 
                        ? "linear-gradient(90deg, #0891b2, #06b6d4)" 
                        : "linear-gradient(90deg, #f59e0b, #fbbf24)"
                    }} />
                  </div>
                  <p style={S.progressText}>
                    {avgScore !== null 
                      ? avgScore >= schoolTarget 
                        ? "✓ Đã đạt mục tiêu!" 
                        : `Cần thêm ${(schoolTarget - avgScore).toFixed(1)} điểm`
                      : "Chưa có dữ liệu"}
                  </p>
                </div>

                <div 
                  style={S.goalCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 16px 40px rgba(0, 0, 0, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.06)";
                  }}
                >
                  <div style={S.goalHeader}>
                    <div style={S.goalIconWrap}>
                      <span style={S.goalIcon}><Icons.Graduation /></span>
                    </div>
                    <div>
                      <p style={S.goalLabel}>Mục tiêu THPTQG</p>
                      <p style={S.goalValue}>{uniTarget}/30 điểm</p>
                    </div>
                  </div>
                  <div style={S.progressTrack}>
                    <div style={{
                      ...S.progressBar,
                      width: `${avgScore !== null && avgScore30 !== null ? Math.min(100, Number(avgScore30) / uniTarget * 100) : 0}%`,
                      background: avgScore !== null && avgScore30 !== null && Number(avgScore30) >= uniTarget
                        ? "linear-gradient(90deg, #0891b2, #06b6d4)"
                        : "linear-gradient(90deg, #f59e0b, #fbbf24)"
                    }} />
                  </div>
                  <p style={S.progressText}>
                    {avgScore30 !== null
                      ? Number(avgScore30) >= uniTarget
                        ? "✓ Đã đạt mục tiêu!"
                        : `Cần thêm ${(uniTarget - Number(avgScore30)).toFixed(1)} điểm`
                      : "Chưa có dữ liệu"}
                  </p>
                </div>
              </div>
            </section>

            {/* Blog / Inspiration Section */}
            <section style={S.section}>
              <div style={S.sectionHead}>
                <h2 style={S.sectionTitle}><Icons.BookOpen /> Chia sẻ & Truyền cảm hứng</h2>
              </div>
              <div style={S.blogGrid}>
                {BLOG_POSTS.map((post) => {
                  const IconC = Icons[post.icon as keyof typeof Icons];
                  const categoryColors: Record<string, { bg: string; color: string; label: string }> = {
                    inspiration: { bg: "#fef3c7", color: "#d97706", label: "Cảm hứng" },
                    tips: { bg: "#e0f2fe", color: "#0891b2", label: "Mẹo hay" },
                    motivation: { bg: "#fce7f3", color: "#db2777", label: "Động lực" },
                    success: { bg: "#d1fae5", color: "#059669", label: "Thành công" },
                  };
                  const cat = categoryColors[post.category];
                  return (
                    <div 
                      key={post.id} 
                      style={S.blogCard}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.05)";
                      }}
                    >
                      <div style={S.blogHeader}>
                        <span style={{...S.blogIcon, background: cat.bg, color: cat.color}}>
                          {IconC && <IconC />}
                        </span>
                        <span style={{...S.blogCategory, background: cat.bg, color: cat.color}}>
                          {cat.label}
                        </span>
                      </div>
                      <h4 style={S.blogTitle}>{post.title}</h4>
                      <p style={S.blogExcerpt}>{post.excerpt}</p>
                      <div style={S.blogFooter}>
                        <span style={S.blogReadTime}><Icons.Clock /> {post.readTime}</span>
                        <span style={S.blogLink}>Đọc tiếp →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Recent Exams */}
            <section style={S.section}>
              <div style={S.sectionHead}>
                <h2 style={S.sectionTitle}>Bài kiểm tra gần đây</h2>
                <a href="/scores" style={S.viewAllLink}>Xem tất cả →</a>
              </div>
              
              {trackExams.length > 0 ? (
                <div style={S.examList}>
                  {[...trackExams].reverse().slice(0, 5).map((r: any, i: number) => {
                    const pct = Math.round((r.score / r.maxScore) * 10 * 10) / 10;
                    const isGood = pct >= 7;
                    return (
                      <div 
                        key={i} 
                        style={S.examItem}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateX(4px)";
                          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateX(0)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.04)";
                        }}
                      >
                        <div style={{...S.examScoreBox, background: isGood ? "#ecfdf5" : "#fef3c7"}}>
                          <span style={{...S.examScoreNum, color: isGood ? "#059669" : "#d97706"}}>
                            {pct}
                          </span>
                        </div>
                        <div style={S.examDetails}>
                          <p style={S.examName}>{r.examName}</p>
                          <p style={S.examDate}>
                            {new Date(r.date).toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <span style={{...S.examStatus, background: isGood ? "#d1fae5" : "#fef3c7", color: isGood ? "#059669" : "#d97706"}}>
                          {isGood ? "Tốt" : "Cần cải thiện"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={S.emptyCard}>
                  <span style={S.emptyIcon}><Icons.List /></span>
                  <p style={S.emptyText}>Chưa có bài kiểm tra nào</p>
                  <a 
                    href="/exam" 
                    style={S.emptyBtn}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(8, 145, 178, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(8, 145, 178, 0.3)";
                    }}
                  >
                    Làm bài kiểm tra đầu tiên
                  </a>
                </div>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div style={S.rightCol}>
            {/* Todo Widget */}
            <div style={S.widget}>
              <div style={S.widgetHead}>
                <h3 style={S.widgetTitle}><Icons.Flag /> Việc cần làm</h3>
                <a href="/todo" style={S.widgetLink}>Chi tiết</a>
              </div>
              
              <div style={S.todoList}>
                {pendingTodos.length > 0 ? (
                  pendingTodos.slice(0, 4).map((todo) => (
                    <div key={todo.id} style={S.todoItem}>
                      <button 
                        onClick={() => toggleTodo(todo.id)}
                        style={{
                          ...S.todoCheck,
                          background: todo.completed ? "linear-gradient(135deg, #0891b2, #06b6d4)" : "#fff",
                          borderColor: todo.completed ? "#0891b2" : "#d1d5db",
                        }}
                      >
                        {todo.completed ? <Icons.Check /> : ""}
                      </button>
                      <span style={{...S.todoText, textDecoration: todo.completed ? "line-through" : "none", opacity: todo.completed ? 0.6 : 1}}>
                        {todo.text}
                      </span>
                      <button 
                        onClick={() => deleteTodo(todo.id)} 
                        style={S.todoDel}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#fee2e2";
                          e.currentTarget.style.color = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#94a3b8";
                        }}
                      >
                        <Icons.Close />
                      </button>
                    </div>
                  ))
                  ) : (
                    <div style={S.todoEmpty}>
                      <span style={S.todoEmptyIcon}><Icons.Party /></span>
                      <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Tất cả hoàn thành!</p>
                    </div>
                  )}
              </div>

              {showTodoInput ? (
                <div style={S.todoInputWrap}>
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTodo()}
                    placeholder="Nhập việc mới..."
                    style={S.todoInput}
                    autoFocus
                  />
                  <button onClick={addTodo} style={S.todoAddBtn}><Icons.Check /></button>
                  <button onClick={() => { setShowTodoInput(false); setNewTodo(""); }} style={S.todoCancelBtn}><Icons.Close /></button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowTodoInput(true)} 
                  style={S.addTodoBtn}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(8, 145, 178, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  + Thêm việc mới
                </button>
              )}
            </div>

            {/* Study Tips */}
            <div style={{...S.widget, background: "linear-gradient(135deg, #fef3c7, #fde68a)"}}>
              <h3 style={{...S.widgetTitle, color: "#92400e"}}><Icons.Lightbulb /> Mẹo học hôm nay</h3>
              <div style={S.tipsList}>
                <div style={S.tipItem}>
                  <span style={S.tipIcon}><Icons.Timer /></span>
                  <p style={S.tipText}>Kỹ thuật Pomodoro: Học 25p, nghỉ 5p</p>
                </div>
                <div style={S.tipItem}>
                  <span style={S.tipIcon}><Icons.BookOpen /></span>
                  <p style={S.tipText}>Ôn bài trước khi ngủ để nhớ lâu hơn</p>
                </div>
                <div style={S.tipItem}>
                  <span style={S.tipIcon}><Icons.Target /></span>
                  <p style={S.tipText}>Đặt mục tiêu rõ ràng cho mỗi ngày</p>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div style={S.widget}>
              <h3 style={S.widgetTitle}><Icons.TrendUp /> Thống kê</h3>
              <div style={S.statsGrid}>
                <div style={S.statItem}>
                  <span style={S.statNum}>{avgScore !== null ? avgScore.toFixed(1) : "—"}</span>
                  <span style={S.statLabel}>Điểm TB</span>
                </div>
                <div style={S.statItem}>
                  <span style={S.statNum}>{trackExams.length}</span>
                  <span style={S.statLabel}>Bài đã làm</span>
                </div>
                <div style={S.statItem}>
                  <span style={S.statNum}>
                    {trackExams.length > 0 
                      ? Math.max(...trackExams.map((r: any) => (r.score / r.maxScore) * 10)).toFixed(1)
                      : "—"}
                  </span>
                  <span style={S.statLabel}>Điểm cao nhất</span>
                </div>
                <div style={S.statItem}>
                  <span style={S.statNum}>{completedTodos.length}</span>
                  <span style={S.statLabel}>Đã hoàn thành</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

const S: Record<string, React.CSSProperties> = {
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
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #0891b2",
    animation: "spin 1s linear infinite",
  },
  pageWrapper: {
    background: "#F4F7F6",
    minHeight: "calc(100vh - 70px)",
    paddingTop: 0,
  },
  welcomeBanner: {
    background: "linear-gradient(135deg, #006666 0%, #0891b2 50%, #06b6d4 100%)",
    borderRadius: "0 0 24px 24px",
    padding: "32px 48px 48px",
    margin: 0,
    marginTop: 56,
    position: "relative" as const,
  },
  welcomeBannerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    position: "relative" as const,
    zIndex: 1,
  },
  welcomeContent: {
    textAlign: "center" as const,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: "#fff",
    margin: "0 0 4px",
  },
  highlightName: {
    color: "#fef08a",
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.9)",
    margin: 0,
  },
  floatingStatsContainer: {
    maxWidth: 1200,
    margin: "-16px auto 0",
    padding: "0 48px",
    position: "relative" as const,
    zIndex: 10,
  },
  floatingStats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
  },
  statCard: {
    background: "#fff",
    borderRadius: 16,
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.8)",
    transition: "all 0.3s ease",
    cursor: "pointer",
    minHeight: 76,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    flexShrink: 0,
  },
  statContent: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  statNum: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 500,
    marginTop: 2,
  },
  mainContent: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "40px 48px 32px",
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: 32,
  },
  leftCol: {},
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  section: {
    marginBottom: 36,
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1f2937",
    margin: "0 0 16px",
  },
  viewAllLink: {
    fontSize: 14,
    color: "#0891b2",
    textDecoration: "none",
    fontWeight: 600,
    transition: "color 0.2s",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  actionCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    background: "#fff",
    borderRadius: 16,
    padding: "18px 16px",
    textDecoration: "none",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
    border: "2px solid transparent",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
  actionInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1f2937",
    margin: "0 0 4px",
  },
  actionDesc: {
    fontSize: 13,
    color: "#6b7280",
    margin: 0,
  },
  actionArrow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    transition: "all 0.25s ease",
  },
  goalsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  goalCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
    border: "1px solid rgba(0, 0, 0, 0.04)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  goalHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  goalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(8, 145, 178, 0.15)",
  },
  goalIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  goalLabel: {
    fontSize: 13,
    color: "#6b7280",
    margin: "0 0 4px",
    fontWeight: 500,
  },
  goalValue: {
    fontSize: 17,
    fontWeight: 800,
    color: "#1f2937",
    margin: 0,
  },
  progressTrack: {
    height: 10,
    background: "#f3f4f6",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    borderRadius: 99,
    transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundSize: "200% 100%",
    animation: "gradientFlow 2s ease infinite",
  },
  progressText: {
    fontSize: 13,
    color: "#6b7280",
    margin: 0,
    fontWeight: 500,
  },
  examList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  examItem: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: "#fff",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
    border: "1px solid rgba(0, 0, 0, 0.04)",
    transition: "all 0.2s ease",
  },
  examScoreBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  examScoreNum: {
    fontSize: 22,
    fontWeight: 800,
  },
  examDetails: {
    flex: 1,
  },
  examName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#0f172a",
    margin: "0 0 4px",
  },
  examDate: {
    fontSize: 12,
    color: "#94a3b8",
    margin: 0,
  },
  examStatus: {
    padding: "6px 12px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 600,
  },
  emptyCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 40,
    textAlign: "center",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
    border: "1px solid rgba(0, 0, 0, 0.04)",
  },
  emptyIcon: {
    display: "flex",
    justifyContent: "center",
  },
  blogGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  blogCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
    border: "1px solid rgba(0, 0, 0, 0.04)",
    transition: "all 0.25s ease",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
  },
  blogHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  blogIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  blogCategory: {
    padding: "4px 10px",
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 600,
  },
  blogTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 10px",
    lineHeight: 1.4,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  blogExcerpt: {
    fontSize: 13,
    color: "#64748b",
    margin: "0 0 16px",
    lineHeight: 1.6,
    flex: 1,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  blogFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTop: "1px solid #f1f5f9",
  },
  blogReadTime: {
    fontSize: 12,
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  blogLink: {
    fontSize: 13,
    color: "#0891b2",
    fontWeight: 600,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    margin: "0 0 20px",
  },
  emptyBtn: {
    display: "inline-block",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #0891b2, #06b6d4)",
    color: "#fff",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    boxShadow: "0 4px 12px rgba(8, 145, 178, 0.3)",
    transition: "all 0.25s ease",
  },
  widget: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
    border: "1px solid rgba(0, 0, 0, 0.04)",
  },
  widgetHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  widgetTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1f2937",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  widgetLink: {
    fontSize: 13,
    color: "#0891b2",
    textDecoration: "none",
    fontWeight: 600,
  },
  todoList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 14,
  },
  todoItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    background: "#f8fafc",
    borderRadius: 12,
    transition: "all 0.2s ease",
  },
  todoCheck: {
    width: 22,
    height: 22,
    borderRadius: 8,
    border: "2px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    padding: 0,
    transition: "all 0.2s ease",
  },
  todoText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  todoDel: {
    width: 24,
    height: 24,
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    fontSize: 16,
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  todoEmpty: {
    textAlign: "center",
    padding: "12px 0",
  },
  todoEmptyIcon: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 8,
  },
  todoInputWrap: {
    display: "flex",
    gap: 8,
  },
  todoInput: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1.5px solid #e0f2fe",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
  },
  todoAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #0891b2, #06b6d4)",
    color: "#fff",
    fontSize: 18,
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  todoCancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#64748b",
    fontSize: 18,
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  addTodoBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    border: "2px dashed #0891b2",
    background: "transparent",
    color: "#0891b2",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  tipsList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  tipItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  tipIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: "#78350f",
    margin: 0,
    lineHeight: 1.5,
  },
};
