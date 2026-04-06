import { initializeApp, getApps, getApp } from "firebase/app";
import { browserSessionPersistence, getAuth, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// Validate config
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error("Firebase config missing. Please check your environment variables.");
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

// Use session persistence - auth state only lasts for current browser session
// This prevents cached state issues when users switch accounts or have stale data
setPersistence(firebaseAuth, browserSessionPersistence).catch((e) => {
  console.warn("Firebase persistence set failed:", e);
});

