/**
 * controllers/auth.controller.ts
 * ------------------------------
 * The actual sign-in / sign-up happens on the frontend via the Firebase
 * Auth SDK. This controller's job is to maintain the matching user
 * profile document in Firestore (users/{uid}) and provide simple
 * acknowledgements for sign-in / sign-out.
 *
 * Contains:
 *   - signup()    create a Firestore user profile doc after Firebase Auth
 *   - signin()    return the current user (and update lastLoginAt)
 *   - signout()   no-op acknowledgement (real sign-out happens client-side)
 */

import { Request, Response } from 'express';
import { getDb, getAuth, isFirebaseReady } from '../config/firebase.js';

/**
 * signup
 * Takes { idToken, name } in the body. Verifies the Firebase ID token
 * (so we trust the uid + email), then writes a profile doc to
 * users/{uid}. Returns the created profile.
 */
export async function signup(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const { idToken, name } = req.body;
  if (!idToken || !name) {
    res.status(400).json({ error: 'idToken and name are required' });
    return;
  }

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    const profile = {
      name,
      email: decoded.email || '',
      avatarLetter: name.charAt(0).toUpperCase(),
      memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      createdAt: new Date().toISOString()
    };

    await getDb().collection('users').doc(decoded.uid).set(profile, { merge: true });

    res.status(201).json({ user: { uid: decoded.uid, ...profile } });
  } catch (err) {
    console.error('[auth.signup]', err);
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * signin
 * Takes { idToken } in the body. Verifies the token, updates
 * lastLoginAt on the user doc (creating it if missing), returns the
 * profile. Used to ensure the user record exists for older accounts.
 */
export async function signin(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const { idToken } = req.body;
  if (!idToken) {
    res.status(400).json({ error: 'idToken is required' });
    return;
  }

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    const ref = getDb().collection('users').doc(decoded.uid);
    const doc = await ref.get();

    if (!doc.exists) {
      // First sign-in for an account created elsewhere — bootstrap a profile.
      const profile = {
        name: decoded.name || decoded.email?.split('@')[0] || 'User',
        email: decoded.email || '',
        avatarLetter: (decoded.name || 'U').charAt(0).toUpperCase(),
        memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      await ref.set(profile);
      res.json({ user: { uid: decoded.uid, ...profile } });
      return;
    }

    await ref.update({ lastLoginAt: new Date().toISOString() });
    res.json({ user: { uid: decoded.uid, ...doc.data() } });
  } catch (err) {
    console.error('[auth.signin]', err);
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * signout
 * No body. Acknowledges. The frontend handles real sign-out by calling
 * firebase.auth().signOut() — this endpoint is here for symmetry.
 */
export async function signout(_req: Request, res: Response): Promise<void> {
  res.json({ ok: true });
}
