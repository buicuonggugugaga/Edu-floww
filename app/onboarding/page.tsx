"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { Icons } from "../components/Icons";

type Grade = 10 | 11 | 12;
type Track = "science" | "social" | "mixed";

const TRACK_OPTIONS = [
  {
    value: "science",
    label: "Khối A00 / A01 / B00",
    desc: "Toán, Lý, Hóa / Toán, Hóa, Sinh",
  },
  {
    value: "social",
    label: "Khối C00 / D01",
    desc: "Văn, Sử, Địa / Toán, Văn, Anh",
  },
  { value: "mixed", label: "Tất cả môn", desc: "Toán, Văn, Anh + môn tự chọn" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check session
        const sessionRes = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include"
        });
        
        if (!sessionRes.ok) {
          router.push("/login");
          return;
        }
        
        const sessionData = await sessionRes.json();
        
        if (!sessionData.authenticated) {
          router.push("/login");
          return;
        }
        
        // Check if user already has a profile
        const res = await fetch("/api/student", {
          credentials: "include"
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            router.push("/dashboard");
            return;
          }
        }
      } catch (e) {
        console.error("Failed to check profile:", e);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    
    // Also listen to Firebase auth state
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) {
        router.push("/login");
      }
    });
    
    checkAuth();
    
    return () => unsub();
  }, [router]);

  const [form, setForm] = useState({
    name: "",
    grade: 12 as Grade,
    track: "mixed" as Track,
    school: "",
    targetScore: 7,
    phone: "",
  });

  if (loading) {
    return (
      <div style={S.page}>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "3px solid #e2e8f0",
              borderTop: "3px solid #3b82f6",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  function setField(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/student", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lỗi lưu hồ sơ");
      // Sau onboarding → làm bài kiểm tra đầu vào
      router.push("/exam");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const canStep1 = form.name.trim().length > 0 && form.school.trim().length > 0;

  return (
    <div style={S.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div style={S.card}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.logoBox}><Icons.Graduation /></div>
          <h1 style={S.title}>Chào mừng bạn!</h1>
          <p style={S.subtitle}>
            Cho chúng tôi biết thêm về bạn để tạo lộ trình học phù hợp nhất
          </p>
        </div>

        {/* Step indicator */}
        <div style={S.stepsRow}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                flex: s < 3 ? 1 : 0,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  background: step >= s ? "#3b82f6" : "#f1f5f9",
                  color: step >= s ? "#fff" : "#94a3b8",
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                {step > s ? "✓" : s}
              </div>
              {s < 3 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: step > s ? "#3b82f6" : "#f1f5f9",
                    transition: "all 0.2s",
                    margin: "0 4px",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Bước 1: Thông tin cá nhân ── */}
        {step === 1 && (
          <div style={S.stepBody}>
            <h2 style={S.stepTitle}>Thông tin cá nhân</h2>

            <div style={S.field}>
              <label style={S.label}>Họ và tên *</label>
              <input
                style={S.input}
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            <div style={S.field}>
              <label style={S.label}>Trường học *</label>
              <input
                style={S.input}
                placeholder="THPT Nguyễn Du"
                value={form.school}
                onChange={(e) => setField("school", e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            <div style={S.field}>
              <label style={S.label}>Số điện thoại (không bắt buộc)</label>
              <input
                style={S.input}
                placeholder="0912345678"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            <button
              style={{ ...S.btn, opacity: canStep1 ? 1 : 0.5 }}
              disabled={!canStep1}
              onClick={() => setStep(2)}
            >
              Tiếp theo →
            </button>
          </div>
        )}

        {/* ── Bước 2: Chọn lớp ── */}
        {step === 2 && (
          <div style={S.stepBody}>
            <h2 style={S.stepTitle}>Bạn đang học lớp mấy?</h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 24,
              }}
            >
              {([10, 11, 12] as Grade[]).map((g) => {
                const active = form.grade === g;
                return (
                  <button
                    key={g}
                    onClick={() => setField("grade", g)}
                    style={{
                      padding: "16px 20px",
                      borderRadius: 14,
                      border: active
                        ? "2px solid #3b82f6"
                        : "1.5px solid #e2e8f0",
                      background: active ? "#eff6ff" : "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: active ? "#1d4ed8" : "#0f172a",
                        }}
                      >
                        Lớp {g}
                      </div>
                      <div
                        style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}
                      >
                        {g === 10
                          ? "Năm đầu THPT — xây nền tảng"
                          : g === 11
                            ? "Năm giữa — đào sâu kiến thức"
                            : "Năm cuối — luyện thi THPT QG"}
                      </div>
                    </div>
                    {active && (
                      <span style={{ color: "#3b82f6", fontSize: 20 }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button style={S.btnOutline} onClick={() => setStep(1)}>
                ← Quay lại
              </button>
              <button style={{ ...S.btn, flex: 2 }} onClick={() => setStep(3)}>
                Tiếp theo →
              </button>
            </div>
          </div>
        )}

        {/* ── Bước 3: Khối thi + Mục tiêu ── */}
        {step === 3 && (
          <div style={S.stepBody}>
            <h2 style={S.stepTitle}>Định hướng & Mục tiêu</h2>

            <label style={S.label}>Khối thi</label>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 22,
              }}
            >
              {TRACK_OPTIONS.map((t) => {
                const active = form.track === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setField("track", t.value)}
                    style={{
                      padding: "14px 18px",
                      borderRadius: 14,
                      border: active
                        ? "2px solid #3b82f6"
                        : "1.5px solid #e2e8f0",
                      background: active ? "#eff6ff" : "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      transition: "all 0.15s",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: active
                          ? "5px solid #3b82f6"
                          : "2px solid #cbd5e1",
                        flexShrink: 0,
                        transition: "all 0.15s",
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: active ? "#1d4ed8" : "#0f172a",
                        }}
                      >
                        {t.label}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}
                      >
                        {t.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <label style={S.label}>
              Mục tiêu điểm thi:{" "}
              <strong style={{ color: "#3b82f6" }}>
                {form.targetScore}/10
              </strong>
            </label>
            <input
              type="range"
              min={5}
              max={10}
              step={0.5}
              value={form.targetScore}
              onChange={(e) =>
                setField("targetScore", parseFloat(e.target.value))
              }
              style={{ width: "100%", marginBottom: 6, accentColor: "#3b82f6" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "#94a3b8",
                marginBottom: 22,
              }}
            >
              <span>5.0 — TB</span>
              <span>7.5 — Khá</span>
              <span>10 — Xuất sắc</span>
            </div>

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#ef4444",
                  marginBottom: 14,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button style={S.btnOutline} onClick={() => setStep(2)}>
                ← Quay lại
              </button>
              <button
                style={{ ...S.btn, flex: 2, opacity: saving ? 0.6 : 1 }}
                disabled={saving}
                onClick={handleSubmit}
              >
                {saving ? "Đang lưu..." : "Bắt đầu kiểm tra →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "'Roboto', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 500,
    background: "#fff",
    borderRadius: 28,
    padding: 40,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  header: { textAlign: "center", marginBottom: 32 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    background: "linear-gradient(135deg, #0891b2, #06b6d4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
    margin: "0 auto 16px",
    boxShadow: "0 8px 24px rgba(8, 145, 178, 0.3)",
  },
  title: { fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" },
  subtitle: { fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.6 },
  stepsRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 32,
  },
  stepBody: { display: "flex", flexDirection: "column" },
  stepTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 24px",
  },
  field: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    display: "block",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 48,
    border: "1.5px solid #e0f2fe",
    borderRadius: 12,
    padding: "0 14px",
    fontSize: 15,
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  },
  btn: {
    height: 52,
    background: "linear-gradient(135deg, #0891b2, #06b6d4)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    flex: 1,
    transition: "opacity 0.15s",
    boxShadow: "0 4px 14px rgba(8, 145, 178, 0.4)",
  },
  btnOutline: {
    height: 52,
    background: "#fff",
    color: "#374151",
    border: "1.5px solid #e2e8f0",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    flex: 1,
  },
};
