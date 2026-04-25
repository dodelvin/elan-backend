/**
 * controllers/users.controller.ts
 * -------------------------------
 * Profile data — reads / writes users/{uid}. The profile screen also
 * needs aggregate stats (lifetime totals, badges) which we compute on
 * the fly from the user's session subcollections.
 *
 * Contains:
 *   - getMe()      profile + stats + badges in a single payload
 *   - updateMe()   patch name / preferences
 */

import { Request, Response } from 'express';
import { getDb, isFirebaseReady } from '../config/firebase.js';

// Default badges shown on a new account — earned status flips on once the
// user hits the relevant milestone (Phase 4 / future enhancement).
const DEFAULT_BADGES = [
  { name: '7-Day Streak',     emoji: '🔥', earned: false },
  { name: 'Early Bird',       emoji: '🌅', earned: false },
  { name: 'Hydration Hero',   emoji: '💧', earned: false },
  { name: 'Zen Master',       emoji: '🧘', earned: false },
  { name: 'Marathon Runner',  emoji: '🏃', earned: false },
  { name: 'Nutrition Pro',    emoji: '🥗', earned: false }
];

/**
 * getMe
 * No body. Reads the user doc, then aggregates lifetime totals from
 * subcollections (workout_sessions + meditation_sessions). Returns the
 * combined payload for ProfileScreen.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const userRef = getDb().collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    res.status(404).json({ error: 'User profile not found — sign in first' });
    return;
  }

  const profile = userDoc.data() || {};

  // Aggregate lifetime workout / meditation totals from subcollections.
  const [workoutSnap, meditationSnap] = await Promise.all([
    userRef.collection('workout_sessions').get(),
    userRef.collection('meditation_sessions').get()
  ]);

  let totalWorkoutMinutes = 0;
  workoutSnap.forEach(doc => {
    totalWorkoutMinutes += doc.data().durationMinutes || 0;
  });

  let totalMeditationSeconds = 0;
  meditationSnap.forEach(doc => {
    totalMeditationSeconds += doc.data().durationSeconds || 0;
  });

  res.json({
    user: { uid, ...profile },
    stats: {
      achievements: profile.achievements || 0,
      currentStreak: profile.currentStreak || 0,
      goalsMet: profile.goalsMet || 0
    },
    lifetime: {
      totalSteps: profile.totalSteps || 0,
      workoutsCompleted: workoutSnap.size,
      meditationMinutes: Math.round(totalMeditationSeconds / 60),
      sleepAverage: profile.sleepAverage || 0
    },
    badges: profile.badges || DEFAULT_BADGES
  });
}

/**
 * updateMe
 * Takes { name?, preferences? } in the body. Patches the user doc and
 * returns the updated profile.
 */
export async function updateMe(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { name, preferences } = req.body;
  const update: Record<string, unknown> = {};
  if (name) update.name = name;
  if (preferences) update.preferences = preferences;

  await getDb().collection('users').doc(uid).set(update, { merge: true });

  const updated = await getDb().collection('users').doc(uid).get();
  res.json({ user: { uid, ...updated.data() } });
}
