/**
 * controllers/meditations.controller.ts
 * -------------------------------------
 * Meditation catalog reads come from Firestore "meditations" collection.
 * Session logs go to users/{uid}/meditation_sessions.
 *
 * Contains:
 *   - getCatalog()    list of guided sessions
 *   - getById()       single session by id (used by the player screen)
 *   - logSession()    record a completed session
 */

import { Request, Response } from 'express';
import { getDb, isFirebaseReady } from '../config/firebase.js';

/**
 * getCatalog
 * No body. Reads all docs from "meditations" collection.
 */
export async function getCatalog(_req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const snapshot = await getDb().collection('meditations').get();
  const meditations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json({ meditations });
}

/**
 * getById
 * Takes :id in the URL. Returns a single session doc or 404.
 */
export async function getById(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const doc = await getDb().collection('meditations').doc(req.params.id).get();

  if (!doc.exists) {
    res.status(404).json({ error: 'Meditation not found' });
    return;
  }

  res.json({ meditation: { id: doc.id, ...doc.data() } });
}

/**
 * logSession
 * Takes { meditationId, durationSeconds } in the body. Writes a session
 * record under users/{uid}/meditation_sessions.
 */
export async function logSession(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const { meditationId, durationSeconds } = req.body;
  const uid = req.user?.uid;

  if (!meditationId) {
    res.status(400).json({ error: 'meditationId is required' });
    return;
  }
  if (!uid) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const session = {
    meditationId,
    durationSeconds: durationSeconds || 0,
    completedAt: new Date().toISOString()
  };

  const docRef = await getDb()
    .collection('users').doc(uid)
    .collection('meditation_sessions').add(session);

  res.status(201).json({ id: docRef.id, ...session });
}
