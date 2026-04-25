"use client";

import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface MainLayoutProps {
  children: ReactNode;
  userName?: string;
  userGrade?: number;
  onLogout?: () => void;
  showFooter?: boolean;
  fullWidth?: boolean;
  isAuthenticated?: boolean;
}

export default function MainLayout({ 
  children, 
  userName, 
  userGrade, 
  onLogout,
  showFooter = true,
  fullWidth = false,
  isAuthenticated = false,
}: MainLayoutProps) {
  return (
    <div style={styles.wrapper}>
      <Header userName={userName} userGrade={userGrade} onLogout={onLogout} isAuthenticated={isAuthenticated} />
      <main style={fullWidth ? styles.mainFull : styles.main}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    backgroundAttachment: "fixed",
  },
  mainFull: {
    flex: 1,
    width: "100%",
  },
  main: {
    flex: 1,
    width: "100%",
    padding: "32px 24px",
  },
};
