import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getStorage, type Storage } from "firebase-admin/storage";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in environment variables`);
  return value;
}

type FirebaseEnv = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  storageBucket: string;
};

// Read env vars lazily so a missing Firebase config doesn't break the dev
// server until something actually tries to use Firebase Storage.
function readEnv(): FirebaseEnv {
  return {
    projectId: requiredEnv("FIREBASE_PROJECT_ID"),
    clientEmail: requiredEnv("FIREBASE_CLIENT_EMAIL"),
    // Vercel / .env stores newlines escaped as `\n` — restore them.
    privateKey: requiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    storageBucket: requiredEnv("FIREBASE_STORAGE_BUCKET"),
  };
}

let appInstance: App | null = null;

function getAdminApp(): App {
  if (appInstance) return appInstance;
  if (getApps().length > 0) {
    appInstance = getApp();
    return appInstance;
  }
  const env = readEnv();
  appInstance = initializeApp({
    credential: cert({
      projectId: env.projectId,
      clientEmail: env.clientEmail,
      privateKey: env.privateKey,
    }),
    storageBucket: env.storageBucket,
  });
  return appInstance;
}

let storageInstance: Storage | null = null;

export function getFirebaseStorage(): Storage {
  if (!storageInstance) {
    storageInstance = getStorage(getAdminApp());
  }
  return storageInstance;
}

export function getStorageBucket() {
  const bucketName = requiredEnv("FIREBASE_STORAGE_BUCKET");
  return getFirebaseStorage().bucket(bucketName);
}
