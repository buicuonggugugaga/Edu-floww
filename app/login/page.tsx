"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { Icons } from "../components/Icons";

function clearAuthCache() {
  if (typeof window !== "undefined") {
    firebaseAuth.signOut().catch(() => {});
    localStorage.clear();
    sessionStorage.clear();
  }
}

type AuthMode = "choose" | "login" | "register";
type Status = "idle" | "pending" | "creating_session" | "error";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("choose");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const modeRef = useRef<AuthMode>("choose");

  // Clear any cached auth state when entering login page
  useEffect(() => {
    clearAuthCache();
    
    // Check for mode=register in URL
    const urlMode = searchParams.get("mode");
    if (urlMode === "register") {
      setMode("register");
    }
    
    // Quick check if already authenticated via session cookie
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.hasProfile) {
            router.push("/dashboard");
          } else if (data.authenticated && !data.hasProfile) {
            router.push("/onboarding");
          }
        }
      } catch (e) {
        // Continue to login page
      }
    };
    checkSession();
  }, [searchParams]);

  // Đồng bộ ref với state để dùng trong useEffect
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    let timeoutId = setTimeout(() => {
      console.warn("Auth state check timeout");
    }, 10000);

    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      clearTimeout(timeoutId);
      
      if (!user) return;
      if (modeRef.current === "choose") return; // Chưa chọn mode

      setStatus("creating_session");
      setError(null);

      try {
        const idToken = await user.getIdToken();

        // Tạo session + kiểm tra profile
        const sessionRes = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        if (!sessionRes.ok) throw new Error("Không thể tạo phiên đăng nhập");
        const { hasProfile } = await sessionRes.json();

        const currentMode = modeRef.current;

        if (currentMode === "register") {
          if (hasProfile) {
            // Đã có tài khoản → không cho đăng ký lại
            await signOut(firebaseAuth);
            await fetch("/api/auth/session", { method: "DELETE" });
            setStatus("error");
            setError(
              "Tài khoản Google này đã được đăng ký. Vui lòng chọn Đăng nhập.",
            );
            return;
          }
          // Chưa có → đến onboarding điền thông tin
          router.push("/onboarding");
        } else {
          // Đăng nhập: phải có profile
          if (!hasProfile) {
            await signOut(firebaseAuth);
            await fetch("/api/auth/session", { method: "DELETE" });
            setStatus("error");
            setError("Tài khoản này chưa đăng ký. Vui lòng chọn Đăng ký.");
            return;
          }
          router.push("/dashboard");
        }
      } catch (e: any) {
        setStatus("error");
        setError(e.message ?? "Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    });
    
    return () => {
      unsub();
      clearTimeout(timeoutId);
    };
  }, []); // Chỉ chạy 1 lần, dùng ref để đọc mode mới nhất

  function switchMode(m: AuthMode) {
    setMode(m);
    setError(null);
    setStatus("idle");
  }

  async function handleGoogle() {
    setError(null);
    setStatus("pending");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(firebaseAuth, provider);
      
      // Nếu onAuthStateChanged không hoạt động, xử lý trực tiếp
      if (result.user) {
        setStatus("creating_session");
        const idToken = await result.user.getIdToken();

        const sessionRes = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        if (!sessionRes.ok) throw new Error("Không thể tạo phiên đăng nhập");
        const { hasProfile } = await sessionRes.json();

        if (mode === "register") {
          if (hasProfile) {
            await signOut(firebaseAuth);
            await fetch("/api/auth/session", { method: "DELETE" });
            setStatus("error");
            setError("Tài khoản Google này đã được đăng ký. Vui lòng chọn Đăng nhập.");
            return;
          }
          router.push("/onboarding");
        } else {
          if (!hasProfile) {
            await signOut(firebaseAuth);
            await fetch("/api/auth/session", { method: "DELETE" });
            setStatus("error");
            setError("Tài khoản này chưa đăng ký. Vui lòng chọn Đăng ký.");
            return;
          }
          router.push("/dashboard");
        }
      }
    } catch (e: any) {
      console.error("Google auth error:", e);
      setStatus("error");
      if (e.code === "auth/popup-closed-by-user") {
        setError("Đã hủy đăng nhập.");
      } else if (e.code === "auth/popup-blocked") {
        setError("Trình duyệt đã chặn popup. Vui lòng cho phép popup và thử lại.");
      } else {
        setError(e.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    }
  }

  const isLoading = status === "pending" || status === "creating_session";
  const loadingText =
    status === "creating_session" ? "Đang xác thực..." : "Đang kết nối...";

  return (
    <div style={S.page}>
      {/* Background animated shapes */}
      <div style={S.backgroundShapes}>
        <div style={{ ...S.shape, width: 400, height: 400, background: "radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%)", top: "-10%", left: "-10%", animationDelay: "0s" }} />
        <div style={{ ...S.shape, width: 300, height: 300, background: "radial-gradient(circle, rgba(118, 75, 162, 0.3) 0%, transparent 70%)", top: "60%", right: "-5%", animationDelay: "-5s" }} />
        <div style={{ ...S.shape, width: 200, height: 200, background: "radial-gradient(circle, rgba(240, 153, 251, 0.2) 0%, transparent 70%)", bottom: "10%", left: "20%", animationDelay: "-10s" }} />
        <div style={{ ...S.shape, width: 150, height: 150, background: "radial-gradient(circle, rgba(102, 126, 234, 0.2) 0%, transparent 70%)", top: "20%", right: "30%", animationDelay: "-15s" }} />
      </div>
      <style>{keyframes}</style>
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logoWrap}>
          <div style={S.logoBox}><Icons.Book /></div>
          <h1 style={S.appName}>EduFlow</h1>
          <p style={S.appDesc}>
            Học tập thông minh với lộ trình cá nhân hóa bởi AI
          </p>
        </div>

        {/* ── Chọn mode ── */}
        {mode === "choose" && (
          <>
            <div style={S.modeGrid}>
              <button style={S.modeCard} onClick={() => switchMode("login")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(102, 126, 234, 0.15)";
                  e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.4)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span style={{ fontSize: 32, display: "flex" }}><Icons.Bolt /></span>
                <span style={S.modeTitle}>Đăng nhập</span>
                <span style={S.modeDesc}>Tôi đã có tài khoản</span>
              </button>
              <button
                style={{
                  ...S.modeCard,
                  border: "1px solid rgba(240, 153, 251, 0.3)",
                  background: "rgba(240, 153, 251, 0.1)",
                }}
                onClick={() => switchMode("register")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(240, 153, 251, 0.25)";
                  e.currentTarget.style.borderColor = "rgba(240, 153, 251, 0.5)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(240, 153, 251, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(240, 153, 251, 0.3)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span style={{ fontSize: 32, display: "flex" }}><Icons.Sparkles /></span>
                <span style={S.modeTitle}>Đăng ký</span>
                <span style={S.modeDesc}>Tạo tài khoản mới</span>
              </button>
            </div>
            <p
              style={{
                textAlign: "center",
                fontSize: 13,
                color: "rgba(255, 255, 255, 0.5)",
                margin: 0,
              }}
            >
              Sử dụng tài khoản Google của bạn
            </p>
          </>
        )}

        {/* ── Đăng nhập ── */}
        {mode === "login" && (
          <>
            <div style={S.backRow}>
              <button style={S.backBtn} onClick={() => switchMode("choose")}>
                ← Quay lại
              </button>
              <span style={S.badge}>Đăng nhập</span>
            </div>
            <p style={S.hint}>
              Tiếp tục với tài khoản Google đã đăng ký trước đó.
            </p>
            <button
              style={{ ...S.googleBtn, opacity: isLoading ? 0.6 : 1 }}
              disabled={isLoading}
              onClick={handleGoogle}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 30px rgba(102, 126, 234, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.4)";
              }}
            >
              <GoogleIcon />
              {isLoading ? loadingText : "Đăng nhập với Google"}
            </button>
            <p style={S.switchText}>
              Chưa có tài khoản?{" "}
              <button
                style={S.switchLink}
                onClick={() => switchMode("register")}
              >
                Đăng ký ngay
              </button>
            </p>
          </>
        )}

        {/* ── Đăng ký ── */}
        {mode === "register" && (
          <>
            <div style={S.backRow}>
              <button style={S.backBtn} onClick={() => switchMode("choose")}>
                ← Quay lại
              </button>
              <span
                style={{ ...S.badge, background: "linear-gradient(135deg, #f093fb, #f5576c)" }}
              >
                Đăng ký
              </span>
            </div>
            <p style={S.hint}>
              Tạo tài khoản mới. Bạn sẽ điền thông tin học sinh ở bước tiếp
              theo.
            </p>

            {/* Preview các bước */}
            <div style={S.stepPreview}>
              {[
                "Xác thực Google",
                "Điền thông tin học sinh",
                "Làm bài kiểm tra đầu vào",
                "Nhận lộ trình AI cá nhân",
              ].map((s, i) => (
                <div key={s} style={S.stepRow}>
                  <div style={S.stepDot}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.8)" }}>{s}</span>
                </div>
              ))}
            </div>

            <button
              style={{
                ...S.googleBtn,
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                opacity: isLoading ? 0.6 : 1,
              }}
              disabled={isLoading}
              onClick={handleGoogle}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 30px rgba(240, 147, 251, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.4)";
              }}
            >
              <GoogleIcon />
              {isLoading ? loadingText : "Đăng ký với Google"}
            </button>
            <p style={S.switchText}>
              Đã có tài khoản?{" "}
              <button style={S.switchLink} onClick={() => switchMode("login")}>
                Đăng nhập
              </button>
            </p>
          </>
        )}

        {/* Lỗi */}
        {error && (
          <div style={S.errorBox}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <path
        fill="#fff"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#fff"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#fff"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#fff"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "'Roboto', sans-serif",
    position: "relative" as const,
    overflow: "hidden",
  },
  backgroundShapes: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden" as const,
    zIndex: 0,
  },
  shape: {
    position: "absolute" as const,
    borderRadius: "50%",
    animation: "float 20s ease-in-out infinite",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: 28,
    padding: 40,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    position: "relative" as const,
    zIndex: 1,
  },
  logoWrap: { textAlign: "center", marginBottom: 32 },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
    margin: "0 auto 16px",
    boxShadow: "0 20px 40px rgba(102, 126, 234, 0.4)",
    animation: "pulse 3s ease-in-out infinite",
  },
  appName: {
    fontSize: 32,
    fontWeight: 800,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 8px",
    letterSpacing: "-0.5px",
  },
  appDesc: { fontSize: 14, color: "rgba(255, 255, 255, 0.7)", margin: 0, lineHeight: 1.5 },
  modeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 24,
  },
  modeCard: {
    padding: "24px 20px",
    borderRadius: 20,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(255, 255, 255, 0.05)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  modeTitle: { fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" },
  modeDesc: { fontSize: 12, color: "rgba(255, 255, 255, 0.5)" },
  backRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    cursor: "pointer",
    padding: 0,
    transition: "color 0.2s",
  },
  badge: {
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 14px",
    borderRadius: 99,
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
  },
  hint: { fontSize: 14, color: "rgba(255, 255, 255, 0.6)", lineHeight: 1.6, margin: "0 0 24px" },
  stepPreview: {
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: "18px 20px",
    marginBottom: 24,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  stepRow: { display: "flex", alignItems: "center", gap: 14 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
  },
  googleBtn: {
    width: "100%",
    height: 56,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 16,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 8px 20px rgba(102, 126, 234, 0.4)",
  },
  switchText: {
    textAlign: "center",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    margin: "16px 0 0",
  },
  switchLink: {
    background: "none",
    border: "none",
    color: "#a78bfa",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    transition: "color 0.2s",
  },
  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    background: "rgba(239, 68, 68, 0.15)",
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 14,
    color: "#fca5a5",
    marginTop: 16,
    lineHeight: 1.5,
    border: "1px solid rgba(239, 68, 68, 0.3)",
  },
};

const keyframes = `
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-20px) rotate(5deg); }
    50% { transform: translateY(0) rotate(0deg); }
    75% { transform: translateY(20px) rotate(-5deg); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
