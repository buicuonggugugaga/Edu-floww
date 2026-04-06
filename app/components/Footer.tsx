"use client";

import { useRouter } from "next/navigation";

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#64748b">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

const ExamIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#64748b">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>
);

const RoadmapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#64748b">
    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
  </svg>
);

const ScoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#64748b">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#64748b">
    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
  </svg>
);

const GuideIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#64748b">
    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#64748b">
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
  </svg>
);

const HelpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#64748b">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0891b2">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0891b2">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0891b2">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="10" fill="url(#logoGrad)"/>
    <path d="M20 8L28 14V26L20 32L12 26V14L20 8Z" fill="#fff" fillOpacity="0.9"/>
    <path d="M20 14L24 16.5V23.5L20 26L16 23.5V16.5L20 14Z" fill="url(#logoGrad)"/>
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0891b2"/>
        <stop offset="1" stopColor="#06b6d4"/>
      </linearGradient>
    </defs>
  </svg>
);

export default function Footer() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <style>{`
        .social-btn:hover { background: linear-gradient(135deg, #0891b2, #06b6d4) !important; transform: translateY(-2px); }
        .footer-link:hover { color: #06b6d4 !important; }
      `}</style>
      <div style={styles.container}>
        <div style={styles.grid}>
          <div style={styles.brandSection}>
            <div style={styles.brand}>
              <LogoIcon />
              <span style={styles.brandName}>EduFlow</span>
            </div>
            <p style={styles.brandDesc}>
              Nền tảng học tập thông minh với AI, giúp học sinh lớp 10-12 
              xây dựng lộ trình học tập cá nhân hóa.
            </p>
            <div style={styles.social}>
              <button className="social-btn" style={styles.socialBtn}>
                <FacebookIcon />
              </button>
              <button className="social-btn" style={styles.socialBtn}>
                <InstagramIcon />
              </button>
              <button className="social-btn" style={styles.socialBtn}>
                <YouTubeIcon />
              </button>
            </div>
          </div>

          <div style={styles.linkSection}>
            <h4 style={styles.linkTitle}>Điều hướng</h4>
            <div style={styles.linkList}>
              <button className="footer-link" onClick={() => router.push("/dashboard")} style={styles.linkItem}>
                <HomeIcon />
                <span>Trang chủ</span>
              </button>
              <button className="footer-link" onClick={() => router.push("/exam")} style={styles.linkItem}>
                <ExamIcon />
                <span>Kiểm tra</span>
              </button>
              <button className="footer-link" onClick={() => router.push("/roadmap")} style={styles.linkItem}>
                <RoadmapIcon />
                <span>Lộ trình</span>
              </button>
              <button className="footer-link" onClick={() => router.push("/scores")} style={styles.linkItem}>
                <ScoreIcon />
                <span>Điểm số</span>
              </button>
            </div>
          </div>

          <div style={styles.linkSection}>
            <h4 style={styles.linkTitle}>Hỗ trợ</h4>
            <div style={styles.linkList}>
              <button className="footer-link" onClick={() => router.push("/settings")} style={styles.linkItem}>
                <SettingsIcon />
                <span>Cài đặt</span>
              </button>
              <button className="footer-link" style={styles.linkItem}>
                <GuideIcon />
                <span>Hướng dẫn</span>
              </button>
              <button className="footer-link" style={styles.linkItem}>
                <ChatIcon />
                <span>Liên hệ</span>
              </button>
              <button className="footer-link" style={styles.linkItem}>
                <HelpIcon />
                <span>FAQ</span>
              </button>
            </div>
          </div>

          <div style={styles.linkSection}>
            <h4 style={styles.linkTitle}>Liên hệ</h4>
            <div style={styles.contactList}>
              <div style={styles.contactItem}>
                <EmailIcon />
                <span style={styles.contactText}>support@eduflow.vn</span>
              </div>
              <div style={styles.contactItem}>
                <PhoneIcon />
                <span style={styles.contactText}>1900 1234</span>
              </div>
              <div style={styles.contactItem}>
                <LocationIcon />
                <span style={styles.contactText}>Hà Nội, Việt Nam</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.bottomBar}>
          <div style={styles.copyright}>
            © {currentYear} EduFlow. Tất cả quyền được bảo lưu.
          </div>
          <div style={styles.legal}>
            <button style={styles.legalLink}>Chính sách bảo mật</button>
            <span style={styles.divider}>|</span>
            <button style={styles.legalLink}>Điều khoản sử dụng</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    background: "#0f172a",
    color: "#fff",
    padding: "60px 24px 0",
    marginTop: 60,
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
    gap: 48,
    paddingBottom: 48,
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  brandSection: {},
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 800,
    background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  brandDesc: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 1.7,
    margin: "0 0 20px",
  },
  social: {
    display: "flex",
    gap: 10,
  },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "rgba(255, 255, 255, 0.1)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  linkSection: {},
  linkTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 16,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  linkList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  linkItem: {
    background: "none",
    border: "none",
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left" as const,
    padding: "4px 0",
    transition: "color 0.2s",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  contactList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  contactText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  bottomBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 0",
    flexWrap: "wrap" as const,
    gap: 16,
  },
  copyright: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
  },
  legal: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  legalLink: {
    background: "none",
    border: "none",
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
    cursor: "pointer",
  },
  divider: {
    color: "rgba(255, 255, 255, 0.3)",
  },
};
