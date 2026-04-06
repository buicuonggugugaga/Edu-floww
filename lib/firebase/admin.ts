import "server-only";
import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let cachedCert: ReturnType<typeof cert> | null = null;
let adminAppInstance: App | null = null;
let adminAuthInstance: Auth | null = null;

function getServiceAccountCert(): ReturnType<typeof cert> {
  if (cachedCert) return cachedCert;
  
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Missing env: FIREBASE_SERVICE_ACCOUNT");

  let sa: { project_id?: string; client_email?: string; private_key?: string };
  try {
    sa = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT must be valid JSON");
  }

  if (!sa.project_id || !sa.client_email || !sa.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT missing required fields");
  }

  let privateKey = sa.private_key;
  privateKey = privateKey.replace(/\\\\n/g, "\n");
  privateKey = privateKey.replace(/\\n/g, "\n");

  cachedCert = cert({
    projectId: sa.project_id,
    clientEmail: sa.client_email,
    privateKey: privateKey,
  });

  return cachedCert;
}

export function getAdminApp(): App {
  if (!adminAppInstance) {
    adminAppInstance = getApps().length > 0
      ? getApps()[0]!
      : initializeApp({ credential: getServiceAccountCert() });
  }
  return adminAppInstance;
}

export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    adminAuthInstance = getAuth(getAdminApp());
  }
  return adminAuthInstance;
}

// For backward compatibility - use functions, not properties
export const adminApp = { 
  get app() { return getAdminApp(); } 
};
export const adminAuth = { 
  get auth() { return getAdminAuth(); } 
};
