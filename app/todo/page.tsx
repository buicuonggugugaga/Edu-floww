"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "../components/Icons";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  subject?: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
  dueDate?: string;
}

const SUBJECTS = [
  { id: "math", name: "Toán", icon: "Math", color: "#2563eb" },
  { id: "literature", name: "Văn", icon: "Literature", color: "#d97706" },
  { id: "english", name: "Anh", icon: "English", color: "#059669" },
  { id: "physics", name: "Lý", icon: "Physics", color: "#7c3aed" },
  { id: "chemistry", name: "Hóa", icon: "Chemistry", color: "#dc2626" },
  { id: "history", name: "Sử", icon: "History", color: "#4f46e5" },
  { id: "geography", name: "Địa", icon: "Geography", color: "#0d9488" },
  { id: "civic", name: "GDCD", icon: "Civic", color: "#ea580c" },
];

const PRIORITIES = [
  { id: "high", label: "Quan trọng", color: "#ef4444", bg: "#fef2f2" },
  { id: "medium", label: "Bình thường", color: "#f59e0b", bg: "#fffbeb" },
  { id: "low", label: "Thấp", color: "#10b981", bg: "#ecfdf5" },
];

export default function TodoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<"high" | "medium" | "low">("medium");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
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
        }
        
        const saved = localStorage.getItem("study_todos");
        if (saved) {
          setTodos(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Error:", e);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    localStorage.setItem("study_todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      completed: false,
      subject: selectedSubject || undefined,
      priority: selectedPriority,
      createdAt: new Date().toISOString(),
    };
    setTodos([todo, ...todos]);
    setNewTodo("");
    setSelectedSubject(null);
    setSelectedPriority("medium");
    setShowAddForm(false);
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setTodos(todos.filter(t => !t.completed));
  };

  const filteredTodos = todos.filter(t => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const pendingCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p style={{ color: "#94a3b8" }}>Đang tải...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes check { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.push("/dashboard")}>
          <Icons.Back /> Trang chủ
        </button>
        <h1 style={styles.title}><Icons.Check /> Việc cần làm</h1>
        <p style={styles.subtitle}>
          Quản lý công việc học tập của bạn
        </p>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsRow}>
        <div style={{...styles.statCard, background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
          <span style={styles.statValue}>{pendingCount}</span>
          <span style={styles.statLabel}>Đang chờ</span>
        </div>
        <div style={{...styles.statCard, background: "linear-gradient(135deg, #10b981, #059669)"}}>
          <span style={styles.statValue}>{completedCount}</span>
          <span style={styles.statLabel}>Hoàn thành</span>
        </div>
        <div style={{...styles.statCard, background: "linear-gradient(135deg, #f59e0b, #d97706)"}}>
          <span style={styles.statValue}>{todos.length}</span>
          <span style={styles.statLabel}>Tổng cộng</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={styles.filterTabs}>
        {[
          { key: "all", label: "Tất cả", count: todos.length },
          { key: "pending", label: "Chưa xong", count: pendingCount },
          { key: "completed", label: "Đã xong", count: completedCount },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            style={{
              ...styles.filterTab,
              background: filter === tab.key ? "linear-gradient(135deg, #667eea, #764ba2)" : "rgba(255,255,255,0.08)",
              color: filter === tab.key ? "#fff" : "rgba(255,255,255,0.6)",
            }}
          >
            {tab.label}
            <span style={{
              ...styles.filterCount,
              background: filter === tab.key ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
              color: filter === tab.key ? "#fff" : "rgba(255,255,255,0.6)",
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Add Todo Button / Form */}
      {showAddForm ? (
        <div style={styles.addForm}>
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="Nhập công việc cần làm..."
            style={styles.input}
            autoFocus
          />
          
              <div style={styles.formSection}>
            <span style={styles.formLabel}>Môn học (tùy chọn)</span>
            <div style={styles.subjectPicker}>
              {SUBJECTS.map(sub => {
                const IconComponent = Icons[sub.icon as keyof typeof Icons];
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubject(selectedSubject === sub.id ? null : sub.id)}
                    style={{
                      ...styles.subjectBtn,
                      background: selectedSubject === sub.id ? sub.color : "rgba(255,255,255,0.08)",
                      color: selectedSubject === sub.id ? "#fff" : sub.color,
                      borderColor: selectedSubject === sub.id ? sub.color : "rgba(255,255,255,0.1)",
                    }}
                  >
                    {IconComponent && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IconComponent /> {sub.name}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.formSection}>
            <span style={styles.formLabel}>Độ ưu tiên</span>
            <div style={styles.priorityPicker}>
              {PRIORITIES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPriority(p.id as any)}
                  style={{
                    ...styles.priorityBtn,
                    background: selectedPriority === p.id ? p.color + "20" : "rgba(255,255,255,0.08)",
                    color: selectedPriority === p.id ? p.color : "rgba(255,255,255,0.7)",
                    borderColor: selectedPriority === p.id ? p.color : "rgba(255,255,255,0.1)",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.formActions}>
            <button onClick={() => { setShowAddForm(false); setNewTodo(""); }} style={styles.cancelBtn}>
              Hủy
            </button>
            <button onClick={addTodo} style={styles.saveBtn}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icons.Check />
                Thêm việc
              </span>
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAddForm(true)} style={styles.addBtn}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icons.Plus />
            Thêm việc cần làm mới
          </span>
        </button>
      )}

      {/* Todo List */}
      <div style={styles.todoList}>
        {filteredTodos.length > 0 ? (
          filteredTodos.map((todo) => {
            const subject = SUBJECTS.find(s => s.id === todo.subject);
            const priority = PRIORITIES.find(p => p.id === todo.priority);
            
            return (
              <div 
                  key={todo.id} 
                  style={{
                    ...styles.todoItem,
                    opacity: todo.completed ? 0.6 : 1,
                    background: todo.completed ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)",
                  }}
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    style={{
                      ...styles.checkbox,
                      background: todo.completed ? "linear-gradient(135deg, #667eea, #764ba2)" : "rgba(255,255,255,0.08)",
                      borderColor: todo.completed ? "#667eea" : "rgba(255,255,255,0.2)",
                      animation: todo.completed ? "check 0.3s ease" : "none",
                    }}
                  >
                    {todo.completed && <Icons.Check />}
                  </button>

                <div style={styles.todoContent}>
                  <span style={{
                    ...styles.todoText,
                    textDecoration: todo.completed ? "line-through" : "none",
                    color: todo.completed ? "rgba(255,255,255,0.5)" : "#fff",
                  }}>
                    {todo.text}
                  </span>
                  <div style={styles.todoMeta}>
                    {subject && (
                      <span style={{...styles.todoTag, background: subject.color + "30", color: subject.color}}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {(() => { const IconC = Icons[subject.icon as keyof typeof Icons]; return IconC ? <IconC /> : null; })()}
                          {subject.name}
                        </span>
                      </span>
                    )}
                    <span style={{...styles.todoTag, background: priority?.color + "20", color: priority?.color}}>
                      {priority?.label}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => deleteTodo(todo.id)}
                  style={styles.deleteBtn}
                >
                  <Icons.Trash />
                </button>
              </div>
            );
          })
        ) : (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>
              {filter === "all" ? <Icons.List /> : filter === "pending" ? <Icons.Flag /> : <Icons.Party />}
            </span>
            <h3 style={styles.emptyTitle}>
              {filter === "all" 
                ? "Chưa có việc cần làm" 
                : filter === "pending" 
                  ? "Tuyệt vời!" 
                  : "Chưa có việc hoàn thành"}
            </h3>
            <p style={styles.emptyText}>
              {filter === "all" 
                ? "Hãy thêm việc cần làm để bắt đầu" 
                : filter === "pending" 
                  ? "Bạn đã hoàn thành hết việc rồi!" 
                  : "Hoàn thành một số việc để thấy ở đây"}
            </p>
          </div>
        )}
      </div>

      {/* Clear Completed */}
      {completedCount > 0 && (
        <button onClick={clearCompleted} style={styles.clearBtn}>
          <Icons.Trash /> Xóa {completedCount} việc đã hoàn thành
        </button>
      )}

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        <h3 style={styles.quickTitle}><Icons.Bolt /> Việc nhanh</h3>
        <div style={styles.quickGrid}>
          {[
            { text: "Ôn 10 từ vựng Tiếng Anh", subject: "english" },
            { text: "Giải 5 bài Toán", subject: "math" },
            { text: "Đọc lại bài Văn", subject: "literature" },
            { text: "Làm bài tập Vật Lý", subject: "physics" },
          ].map((q, i) => {
            const sub = SUBJECTS.find(s => s.id === q.subject);
            const IconC = sub ? Icons[sub.icon as keyof typeof Icons] : null;
            return (
              <button
                key={i}
                onClick={() => {
                  setNewTodo(q.text);
                  setSelectedSubject(q.subject);
                  setShowAddForm(true);
                }}
                style={styles.quickBtn}
              >
                <span style={{...styles.quickBtnIcon, background: (sub?.color || "#667eea") + "20", color: sub?.color || "#667eea"}}>
                  {IconC && <IconC />}
                </span>
                {q.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    backgroundAttachment: "fixed",
    padding: "24px 24px 60px",
    fontFamily: "'Roboto', sans-serif",
  },
  loading: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.2)",
    borderTop: "3px solid #667eea",
    animation: "spin 1s linear infinite",
  },
  header: {
    marginBottom: 24,
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
    padding: "8px 0",
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
    margin: "0 0 8px",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    margin: 0,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 16,
    padding: "16px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  statValue: {
    display: "block",
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  filterTabs: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    background: "rgba(255,255,255,0.08)",
    padding: 6,
    borderRadius: 14,
    backdropFilter: "blur(10px)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  filterTab: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  filterCount: {
    padding: "2px 8px",
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 700,
  },
  addBtn: {
    width: "100%",
    padding: "14px 20px",
    borderRadius: 14,
    border: "2px dashed rgba(102,126,234,0.6)",
    background: "rgba(255,255,255,0.05)",
    color: "#a5b4fc",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 20,
    transition: "all 0.2s",
  },
  addForm: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    animation: "slideIn 0.3s ease",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1.5px solid rgba(255,255,255,0.1)",
    fontSize: 15,
    outline: "none",
    marginBottom: 16,
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
  },
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
  },
  subjectPicker: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  subjectBtn: {
    padding: "6px 12px",
    borderRadius: 8,
    border: "1.5px solid rgba(255,255,255,0.1)",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.8)",
  },
  priorityPicker: {
    display: "flex",
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1.5px solid transparent",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.7)",
  },
  formActions: {
    display: "flex",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  saveBtn: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(102,126,234,0.4)",
  },
  todoList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 20,
  },
  todoItem: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    transition: "all 0.2s ease",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    border: "2px solid rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
    background: "rgba(255,255,255,0.05)",
  },
  todoContent: {
    flex: 1,
  },
  todoText: {
    display: "block",
    fontSize: 15,
    fontWeight: 500,
    marginBottom: 6,
    lineHeight: 1.4,
    color: "#fff",
  },
  todoMeta: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  todoTag: {
    padding: "2px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500,
    background: "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.7)",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "none",
    background: "rgba(239,68,68,0.1)",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(239,68,68,0.7)",
  },
  emptyState: {
    textAlign: "center",
    padding: 40,
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    borderRadius: 20,
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  emptyIcon: {
    fontSize: 64,
    display: "block",
    marginBottom: 16,
    color: "rgba(255,255,255,0.3)",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 8px",
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    margin: 0,
  },
  clearBtn: {
    width: "100%",
    padding: "12px 20px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    marginBottom: 32,
  },
  quickActions: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 14px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  quickBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
  },
  quickBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    flexShrink: 0,
  },
};
