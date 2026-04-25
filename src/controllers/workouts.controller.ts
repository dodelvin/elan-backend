/**
 * controllers/workouts.controller.ts
 * ----------------------------------
 * Workout catalog reads come from the Firestore "workouts" collection
 * (seeded by `npm run seed`). Session logs are written to
 * users/{uid}/workout_sessions.
 *
 * Contains:
 *   - getCatalog()       list of available workouts
 *   - logSession()       record a completed workout
 *   - getWeeklyStats()   summary tiles for the WorkoutScreen header
 */

import { Request, Response } from 'express';
import { getDb, isFirebaseReady } from '../config/firebase.js';

/**
 * getCatalog
 * No body. Reads all docs from the "workouts" collection.
 * Falls back to an empty list if Firebase isn't initialised.
 */
export async function getCatalog(_req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const snapshot = await getDb().collection('workouts').get();
  const workouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json({ workouts });
}

/**
 * logSession
 * Takes { workoutId, durationMinutes, caloriesBurned } in the body.
 * Writes a new doc to users/{uid}/workout_sessions and returns it.
 */
export async function logSession(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const { workoutId, durationMinutes, caloriesBurned } = req.body;
  const uid = req.user?.uid;

  if (!workoutId) {
    res.status(400).json({ error: 'workoutId is required' });
    return;
  }
  if (!uid) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const session = {
    workoutId,
    durationMinutes: durationMinutes || 0,
    caloriesBurned: caloriesBurned || 0,
    completedAt: new Date().toISOString()
  };

  const docRef = await getDb()
    .collection('users').doc(uid)
    .collection('workout_sessions').add(session);

  res.status(201).json({ id: docRef.id, ...session });
}

/**
 * getWeeklyStats
 * No body. Aggregates the past 7 days of workout_sessions for the user.
 */
export async function getWeeklyStats(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Compute the start of the current week window (7 days ago).
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const snapshot = await getDb()
    .collection('users').doc(uid)
    .collection('workout_sessions')
    .where('completedAt', '>=', sevenDaysAgo.toISOString())
    .get();

  // Variables related to the running totals across the week.
  let timeMinutes = 0;
  let caloriesBurned = 0;
  const workoutsCompleted = snapshot.size;

  snapshot.forEach(doc => {
    const data = doc.data();
    timeMinutes += data.durationMinutes || 0;
    caloriesBurned += data.caloriesBurned || 0;
  });

  res.json({
    weekStart: sevenDaysAgo.toISOString().slice(0, 10),
    totals: { timeMinutes, caloriesBurned, workoutsCompleted }
  });
}
