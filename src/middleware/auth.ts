/**
 * middleware/auth.ts
 * ------------------
 * Express middleware that verifies the Firebase ID token from the
 * Authorization header. Attaches the decoded user info to req.user so
 * controllers can read req.user.uid and req.user.email.
 *
 * Contains:
 *   - requireAuth()  middleware function — call as router.get('...', requireAuth, handler)
 */

import { Request, Response, NextFunction } from 'express';
import { getAuth, isFirebaseReady } from '../config/firebase.js';

// Augment Express's Request type so TypeScript knows about req.user.
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        name?: string;
      };
    }
  }
}

/**
 * requireAuth
 * Takes (req, res, next). Reads the "Authorization: Bearer <token>" header,
 * verifies it with Firebase Admin, attaches the decoded claims to req.user,
 * then calls next(). Responds 401 if the token is missing or invalid.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Short-circuit during Phase 2 stub mode — pretend the user is "demo".
  // Once Firebase is live (Phase 3) this branch is never taken.
  if (!isFirebaseReady()) {
    req.user = { uid: 'demo-user', email: 'demo@elan.dev', name: 'Demo User' };
    next();
    return;
  }

  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);

  if (!match) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  try {
    const decoded = await getAuth().verifyIdToken(match[1]);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name
    };
    next();
  } catch (err) {
    console.error('[auth] token verification failed:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
