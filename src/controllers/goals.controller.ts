/**
 * controllers/goals.controller.ts (NEW FILE)
 * ------------------------------------------
 * Per-user daily targets stored at users/{uid}/preferences/goals.
 *
 * Fields: stepsGoal, waterGoal (glasses), sleepGoal (hours), mindfulnessGoal (min)
 *
 * Contains:
 *   - getGoals()     read goals (with defaults if not set)
 *   - updateGoals()  upsert goals
 */

import { Request, Response } from 'express';
import { getDb, isFirebaseReady } from '../config/firebase.js';

const DEFAULTS = {
  stepsGoal: 10000,
  waterGoal: 8,
  sleepGoal: 8,
  mindfulnessGoal: 15
};

/** GET /api/users/me/goals — returns goals or defaults. */
export async function getGoals(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) { res.status(503).json({ error: 'DB not configured' }); return; }
  const uid = req.user?.uid;
  if (!uid) { res.status(401).json({ error: 'Auth required' }); return; }

  const doc = await getDb().collection('users').doc(uid).collection('preferences').doc('goals').get();
  res.json({ goals: doc.exists ? { ...DEFAULTS, ...doc.data() } : DEFAULTS });
}

/** PUT /api/users/me/goals — upserts goals. */
export async function updateGoals(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) { res.status(503).json({ error: 'DB not configured' }); return; }
  const uid = req.user?.uid;
  if (!uid) { res.status(401).json({ error: 'Auth required' }); return; }

  const { stepsGoal, waterGoal, sleepGoal, mindfulnessGoal } = req.body;
  const update: Record<string, unknown> = {};
  if (stepsGoal !== undefined)        update.stepsGoal = stepsGoal;
  if (waterGoal !== undefined)        update.waterGoal = waterGoal;
  if (sleepGoal !== undefined)        update.sleepGoal = sleepGoal;
  if (mindfulnessGoal !== undefined)  update.mindfulnessGoal = mindfulnessGoal;

  await getDb().collection('users').doc(uid).collection('preferences').doc('goals').set(update, { merge: true });
  res.json({ goals: { ...DEFAULTS, ...update } });
}
