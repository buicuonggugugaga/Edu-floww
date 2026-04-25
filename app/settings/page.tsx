"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "../components/Icons";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    school: "",
    grade: 10,
    track: "mixed" as "science" | "social" | "mixed",
    targetSchoolScore: 7,
    targetUniScore: 18,
    phone: "",
  });

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
          if (profileData.profile) {
            setProfile(profileData.profile);
            setFormData({
              name: profileData.profile.name || "",
              school: profileData.profile.school || "",
              grade: profileData.profile.grade || 10,
              track: profileData.profile.track || "mixed",
              targetSchoolScore: profileData.profile.targetSchoolScore || 7,
              targetUniScore: profileData.profile.targetUniScore || 18,
              phone: profileData.profile.phone || "",
            });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/student", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });
        setProfile(data.profile);
      } else {
        setMessage({ type: "error", text: data.error || "Cập nhật thất bại" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Đã xảy ra lỗi" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.push("/dashboard")}>
          <Icons.Back /> Quay lại
        </button>
        <h1 style={styles.title}><Icons.Settings /> Cài đặt</h1>
      </div>

      {message && (
        <div style={{
          ...styles.message,
          background: message.type === "success" ? "#ecfdf5" : "#fef2f2",
          color: message.type === "success" ? "#059669" : "#dc2626",
          animation: "slideIn 0.3s ease",
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}><Icons.User /> Thông tin cá nhân</h2>
          
          <div style={styles.field}>
            <label style={styles.label}>Họ và tên</label>
            <input
              type="text"
              style={styles.input}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập họ và tên"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Trường học</label>
            <input
              type="text"
              style={styles.input}
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              placeholder="Nhập tên trường"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Số điện thoại (tùy chọn)</label>
            <input
              type="tel"
              style={styles.input}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0xxx xxx xxx"
            />
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}><Icons.Book /> Thông tin học tập</h2>

          <div style={styles.field}>
            <label style={styles.label}>Lớp</label>
            <div style={styles.radioGroup}>
              {[10, 11, 12].map((g) => (
                <label key={g} style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="grade"
                    value={g}
                    checked={formData.grade === g}
                    onChange={() => setFormData({ ...formData, grade: g })}
                    style={styles.radio}
                  />
                  <span style={styles.radioText}>Lớp {g}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Khối thi</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="track"
                  value="mixed"
                  checked={formData.track === "mixed"}
                  onChange={() => setFormData({ ...formData, track: "mixed" })}
                  style={styles.radio}
                />
                <span style={styles.radioText}>Tổng hợp (Tất cả môn)</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="track"
                  value="science"
                  checked={formData.track === "science"}
                  onChange={() => setFormData({ ...formData, track: "science" })}
                  style={styles.radio}
                />
                <span style={styles.radioText}>Khối A/B (Tự nhiên)</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="track"
                  value="social"
                  checked={formData.track === "social"}
                  onChange={() => setFormData({ ...formData, track: "social" })}
                  style={styles.radio}
                />
                <span style={styles.radioText}>Khối C/D (Xã hội)</span>
              </label>
            </div>
            <p style={styles.hint}>
              Khối thi ảnh hưởng đến các bài kiểm tra đề xuất và lộ trình học tập.
              Bạn vẫn có thể làm bài kiểm tra tất cả các môn.
            </p>
          </div>

          <div style={styles.field}>
            <label style={styles.label}><Icons.School /> Mục tiêu điểm trên trường</label>
            <div style={styles.scoreSelector}>
              {[5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  type="button"
                  style={{
                    ...styles.scoreBtn,
                    background: formData.targetSchoolScore === score ? "#10b981" : "#fff",
                    color: formData.targetSchoolScore === score ? "#fff" : "#64748b",
                    borderColor: formData.targetSchoolScore === score ? "#10b981" : "#e2e8f0",
                  }}
                  onClick={() => setFormData({ ...formData, targetSchoolScore: score })}
                >
                  {score}
                </button>
              ))}
            </div>
            <p style={styles.hint}>Điểm bạn muốn đạt được trong các bài kiểm tra trên lớp</p>
          </div>

          <div style={styles.field}>
            <label style={styles.label}><Icons.Graduation /> Mục tiêu điểm Đại học (THPTQG)</label>
            <div style={styles.scoreSelectorUni}>
              {[15, 18, 21, 24, 27, 30].map((score) => (
                <button
                  key={score}
                  type="button"
                  style={{
                    ...styles.scoreBtn,
                    background: formData.targetUniScore === score ? "#8b5cf6" : "#fff",
                    color: formData.targetUniScore === score ? "#fff" : "#64748b",
                    borderColor: formData.targetUniScore === score ? "#8b5cf6" : "#e2e8f0",
                  }}
                  onClick={() => setFormData({ ...formData, targetUniScore: score })}
                >
                  {score}
                </button>
              ))}
            </div>
            <p style={styles.hint}>Điểm mục tiêu cho kỳ thi THPT Quốc gia (thang điểm 30)</p>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}><Icons.Chart /> Thống kê</h2>
          <div style={styles.stats}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{profile?.examResults?.length || 0}</span>
              <span style={styles.statLabel}>Bài đã làm</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>
                {(() => {
                  const validResults = (profile?.examResults || []).filter((r: any) => r.maxScore > 0 && r.score != null);
                  return validResults.length > 0 
                    ? (validResults.reduce((s: number, r: any) => s + (r.score / r.maxScore) * 10, 0) / validResults.length).toFixed(1)
                    : "—";
                })()}/10
              </span>
              <span style={styles.statLabel}>Điểm TB</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{profile?.roadmap ? <Icons.Check /> : "—"}</span>
              <span style={styles.statLabel}>Lộ trình</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          style={{
            ...styles.submitBtn,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
          disabled={saving}
        >
          {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
      </form>
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
    color: "#a5b4fc",
    cursor: "pointer",
    padding: 0,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
    margin: 0,
  },
  message: {
    padding: "14px 18px",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 20,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  section: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 20px",
  },
  field: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    fontSize: 15,
    color: "#fff",
    background: "rgba(255,255,255,0.05)",
    outline: "none",
    boxSizing: "border-box",
  },
  hint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 8,
    lineHeight: 1.5,
  },
  radioGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  },
  radio: {
    width: 18,
    height: 18,
    accentColor: "#667eea",
  },
  radioText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  scoreSelector: {
    display: "flex",
    gap: 10,
  },
  scoreSelectorUni: {
    display: "flex",
    gap: 8,
  },
  scoreBtn: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 12,
    border: "1.5px solid",
    fontSize: 16,
    fontWeight: 700,
    transition: "all 0.15s",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
  },
  statItem: {
    textAlign: "center",
    padding: "16px 8px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
  },
  statValue: {
    display: "block",
    fontSize: 26,
    fontWeight: 800,
    color: "#a5b4fc",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  submitBtn: {
    padding: "16px 24px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 600,
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};
