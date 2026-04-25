"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      fontFamily: "'Roboto', sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "3px solid rgba(255, 255, 255, 0.2)",
          borderTop: "3px solid #667eea",
          animation: "spin 1s linear infinite",
          margin: "0 auto 16px",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14 }}>Đang tải...</p>
      </div>
    </div>
  );
}
