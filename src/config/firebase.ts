/**
 * config/firebase.ts
 * ------------------
 * Initialises Firebase Admin SDK so the backend can read/write Firestore
 * and verify Firebase Auth ID tokens.
 *
 * Two credential modes are supported:
 *   1. FIREBASE_SERVICE_ACCOUNT_PATH — path to a service-account JSON file
 *      (preferred for local dev — set this in .env).
 *   2. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 *      env vars (preferred for hosted environments where you can't ship a
 *      JSON file).
 *
 * Contains:
 *   - initFirebase()  one-shot init, called from index.ts
 *   - getDb()         returns the Firestore singleton
 *   - getAuth()       returns the Firebase Auth Admin singleton
 */

import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';

let initialised = false;

/**
 * initFirebase
 * No arguments. Reads credentials from env (file path OR inline vars) and
 * calls admin.initializeApp() exactly once. Safe to call multiple times.
 */
export function initFirebase(): void {
  if (initialised) return;

  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  try {
    if (base64) {
      // Mode 0 — decode entire service account from base64 (most reliable for hosting)
      const decoded = Buffer.from(base64, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(decoded);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log('[firebase] initialised from base64 env var');
    } else if (filePath && fs.existsSync(path.resolve(filePath))) {
      const raw = fs.readFileSync(path.resolve(filePath), 'utf8');
      const serviceAccount = JSON.parse(raw);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log('[firebase] initialised from service account file');
    } else if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey })
      });
      console.log('[firebase] initialised from env vars');
    } else {
      console.warn('[firebase] no credentials found — running in stub mode');
      return;
    }

    initialised = true;
  } catch (err) {
    console.error('[firebase] init failed:', err);
    throw err;
  }
}

/**
 * getDb
 * No arguments. Returns the Firestore client. Throws if Firebase wasn't
 * initialised — caller should handle that as a 503 / configuration error.
 */
export function getDb(): admin.firestore.Firestore {
  if (!initialised) {
    throw new Error('Firebase not initialised — check .env credentials');
  }
  return admin.firestore();
}

/**
 * getAuth
 * No arguments. Returns the Firebase Auth Admin client (used by the auth
 * middleware to verify ID tokens).
 */
export function getAuth(): admin.auth.Auth {
  if (!initialised) {
    throw new Error('Firebase not initialised — check .env credentials');
  }
  return admin.auth();
}

/** Whether Firebase finished initialising — used by routes to short-circuit. */
export function isFirebaseReady(): boolean {
  return initialised;
}
