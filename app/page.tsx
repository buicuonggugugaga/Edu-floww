"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Immediately redirect to login without waiting for auth
    // Auth will be checked on login page
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      router.replace("/login");
    }
  }, [ready, router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8fafc",
      fontFamily: "'Roboto', sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "3px solid #e2e8f0",
          borderTop: "3px solid #3b82f6",
          animation: "spin 1s linear infinite",
          margin: "0 auto 16px",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#64748b", fontSize: 14 }}>Đang tải...</p>
      </div>
    </div>
  );
}
