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
}

export default function MainLayout({ 
  children, 
  userName, 
  userGrade, 
  onLogout,
  showFooter = true,
  fullWidth = false,
}: MainLayoutProps) {
  return (
    <div style={styles.wrapper}>
      <Header userName={userName} userGrade={userGrade} onLogout={onLogout} />
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
  },
  mainFull: {
    flex: 1,
  },
  main: {
    flex: 1,
    maxWidth: 1200,
    width: "100%",
    margin: "0 auto",
    padding: "32px 24px",
  },
};
