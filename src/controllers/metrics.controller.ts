/**
 * controllers/metrics.controller.ts
 * ---------------------------------
 * Daily wellness metrics — TrackerScreen + HomeScreen data. One doc per
 * user per day at users/{uid}/metrics/{YYYY-MM-DD}.
 *
 * Contains:
 *   - getToday()          read today's values
 *   - saveToday()         upsert today's values
 *   - getHomeOverview()   bundled stats + goals for the Home screen
 */

import { Request, Response } from 'express';
import { getDb, isFirebaseReady } from '../config/firebase.js';

// Helper — current date as YYYY-MM-DD (used as Firestore doc id).
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// Default values for a brand-new day (when no doc exists yet).
const DEFAULT_METRICS = {
  water: 0,
  steps: 0,
  sleep: 0,
  mood: null,
  mindfulness: 0
};

/**
 * getToday
 * No body. Reads users/{uid}/metrics/{today}. Returns DEFAULT_METRICS
 * if the doc doesn't exist yet (first interaction of the day).
 */
export async function getToday(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const date = todayKey();
  const doc = await getDb()
    .collection('users').doc(uid)
    .collection('metrics').doc(date)
    .get();

  res.json({
    date,
    metrics: doc.exists ? doc.data() : DEFAULT_METRICS
  });
}

/**
 * saveToday
 * Takes { water?, steps?, sleep?, mood?, mindfulness? } in the body.
 * Upserts users/{uid}/metrics/{today} with merge: true (partial updates ok).
 */
export async function saveToday(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { water, steps, sleep, mood, mindfulness } = req.body;
  const date = todayKey();

  // Build the patch object — only include fields the client sent.
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (water !== undefined)        update.water = water;
  if (steps !== undefined)        update.steps = steps;
  if (sleep !== undefined)        update.sleep = sleep;
  if (mood !== undefined)         update.mood = mood;
  if (mindfulness !== undefined)  update.mindfulness = mindfulness;

  await getDb()
    .collection('users').doc(uid)
    .collection('metrics').doc(date)
    .set(update, { merge: true });

  res.json({ date, metrics: update, saved: true });
}

/**
 * getHomeOverview
 * No body. Reads today's metrics (or defaults) and formats them into the
 * shape HomeScreen expects: quickStats[] + todayGoals[] + quote.
 */
export async function getHomeOverview(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const date = todayKey();
  const doc = await getDb()
    .collection('users').doc(uid)
    .collection('metrics').doc(date)
    .get();

  const m: any = doc.exists ? doc.data() : DEFAULT_METRICS;

  // Map raw metric values to the display tile shape used by HomeScreen.
  const quickStats = [
    { key: 'steps', label: 'Steps', value: (m.steps || 0).toLocaleString(), target: '10,000' },
    { key: 'water', label: 'Water', value: `${m.water || 0}/8`,             target: 'glasses' },
    { key: 'sleep', label: 'Sleep', value: `${m.sleep || 0}h`,              target: '8h' },
    { key: 'mood',  label: 'Mood',  value: m.mood ? labelForMood(m.mood) : '—', target: '' }
  ];

  // Variables related to the today goal checklist
  // Each one is derived from the matching metric (or default to incomplete).
  const todayGoals = [
    { id: 1, title: 'Morning Meditation',     completed: (m.mindfulness || 0) >= 10, time: `${m.mindfulness || 0} min` },
    { id: 2, title: 'Drink 8 glasses of water', completed: (m.water || 0) >= 8,     time: `${m.water || 0}/8` },
    { id: 3, title: 'Evening Workout',         completed: false,                    time: '30 min' },
    { id: 4, title: 'Log dinner',              completed: false,                    time: 'Pending' }
  ];

  res.json({
    quickStats,
    todayGoals,
    quote: {
      text: 'Wellness is the complete integration of body, mind, and spirit.',
      author: 'Greg Anderson'
    }
  });
}

/** Map mood enum to display label. */
function labelForMood(mood: string): string {
  const labels: Record<string, string> = { great: 'Great', good: 'Good', okay: 'Okay', low: 'Low' };
  return labels[mood] || mood;
}
