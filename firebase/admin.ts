import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseAdminConfig() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return { projectId, clientEmail, privateKey };
}

// Initialize Firebase Admin SDK only when the required service account config exists.
function initFirebaseAdmin() {
  const apps = getApps();
  const { projectId, clientEmail, privateKey } = getFirebaseAdminConfig();

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "Firebase Admin is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to your .env.local file."
    );

    return {
      auth: null,
      db: null,
    };
  }

  if (!apps.length) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
  };
}

export const { auth, db } = initFirebaseAdmin();
