"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icons } from "./Icons";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Trang chủ", icon: <Icons.Home /> },
  { href: "/exam", label: "Kiểm tra", icon: <Icons.Exam /> },
  { href: "/roadmap", label: "Lộ trình", icon: <Icons.Roadmap /> },
  { href: "/scores", label: "Điểm số", icon: <Icons.Score /> },
  { href: "/todo", label: "Việc cần làm", icon: <Icons.Check /> },
];

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

interface HeaderProps {
  userName?: string;
  userGrade?: number;
  onLogout?: () => void;
}

export default function Header({ userName, userGrade, onLogout }: HeaderProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    }
    try {
      await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    router.push("/login");
  };

  return (
    <header style={{ ...styles.header, ...(scrolled ? styles.headerScrolled : {}) }}>
      <div style={styles.container}>
        <Link href="/dashboard" style={styles.logo}>
          <LogoIcon />
          <span style={styles.logoText}>EduFlow</span>
        </Link>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              style={styles.navLink}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.querySelector('.navIcon')?.setAttribute('style', 'color: #fff');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#64748b";
                e.currentTarget.querySelector('.navIcon')?.setAttribute('style', 'display: flex; align-items: center; justify-content: center; color: #64748b');
              }}
            >
              <span className="navIcon" style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={styles.actions}>
          {userName && (
            <div style={styles.userInfo}>
              <div style={styles.userAvatar}>
                <Icons.User />
              </div>
              <div style={styles.userDetails}>
                <span style={styles.userName}>{userName}</span>
                {userGrade && (
                  <span style={styles.userGrade}>Lớp {userGrade}</span>
                )}
              </div>
            </div>
          )}
          <Link 
            href="/settings" 
            style={styles.iconBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            <Icons.Settings />
          </Link>
          <button 
            onClick={handleLogout} 
            style={styles.iconBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            <Icons.Logout />
          </button>
        </div>

        <button 
          style={styles.mobileMenuBtn}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Icons.Menu />
        </button>
      </div>

      {mobileMenuOpen && (
        <div style={styles.mobileMenu}>
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              style={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <Link href="/settings" style={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
            <Icons.Settings />
            <span>Cài đặt</span>
          </Link>
          <button onClick={handleLogout} style={styles.mobileNavLink}>
            <Icons.Logout />
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
    transition: "all 0.3s ease",
  },
  headerScrolled: {
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    height: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
  },
  logoText: {
    fontSize: 20,
    fontWeight: 800,
    background: "linear-gradient(135deg, #0891b2, #06b6d4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderRadius: 12,
    textDecoration: "none",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.25s ease",
    position: "relative" as const,
  },
  navIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    transition: "color 0.25s ease",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    background: "#f8fafc",
    borderRadius: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #0891b2, #06b6d4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  userDetails: {
    display: "flex",
    flexDirection: "column",
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
  },
  userGrade: {
    fontSize: 12,
    color: "#64748b",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: "#f8fafc",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    transition: "all 0.25s ease",
    textDecoration: "none",
  },
  mobileMenuBtn: {
    display: "none",
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "#f8fafc",
    border: "none",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
  },
  mobileMenu: {
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    background: "#fff",
    padding: 16,
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  mobileNavLink: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 10,
    textDecoration: "none",
    color: "#475569",
    fontSize: 14,
    fontWeight: 500,
    background: "none",
    border: "none",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
  },
};
