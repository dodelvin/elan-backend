/**
 * controllers/meals.controller.ts
 * -------------------------------
 * Daily meal log. Each entry is a doc in
 * users/{uid}/meals/{auto-id}, with mealType + item + calories + date.
 *
 * Contains:
 *   - getToday()    today's meals grouped by slot + macro totals
 *   - addMeal()     insert a new meal entry
 *   - deleteMeal()  remove an entry by id
 */

import { Request, Response } from 'express';
import { getDb, isFirebaseReady } from '../config/firebase.js';

// Variables related to the four meal slot definitions used in the response.
const SLOTS = [
  { id: 'breakfast', name: 'Breakfast', defaultTime: '8:00 AM' },
  { id: 'lunch',     name: 'Lunch',     defaultTime: '12:30 PM' },
  { id: 'dinner',    name: 'Dinner',    defaultTime: 'Not logged' },
  { id: 'snacks',    name: 'Snacks',    defaultTime: 'Throughout day' }
];

// Helper — date key shared by all reads/writes for "today".
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * getToday
 * No body. Reads today's meal entries, groups them into the 4 slots,
 * and returns the grouped view + macro placeholders.
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
  const snapshot = await getDb()
    .collection('users').doc(uid)
    .collection('meals')
    .where('date', '==', date)
    .get();

  // Group entries by mealType + sum calories per slot.
  const grouped: Record<string, { items: string[]; calories: number; entryIds: string[] }> = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    const slot = data.mealType;
    if (!grouped[slot]) grouped[slot] = { items: [], calories: 0, entryIds: [] };
    grouped[slot].items.push(data.item);
    grouped[slot].calories += data.calories || 0;
    grouped[slot].entryIds.push(doc.id);
  });

  const meals = SLOTS.map(slot => {
    const g = grouped[slot.id];
    return {
      id: slot.id,
      name: slot.name,
      time: g ? slot.defaultTime : 'Not logged',
      calories: g?.calories || 0,
      items: g?.items || [],
      entryIds: g?.entryIds || []
    };
  });

  // Sum totals across all slots for the macro card.
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);

  res.json({
    date,
    meals,
    nutrition: {
      calories: { value: totalCalories, target: 2000 },
      protein:  { value: 0, target: 100 },   // placeholder until we add macros
      carbs:    { value: 0, target: 250 },
      fats:     { value: 0, target: 70  }
    }
  });
}

/**
 * addMeal
 * Takes { mealType, item, calories } in the body. Adds a new doc to
 * users/{uid}/meals.
 */
export async function addMeal(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { mealType, item, calories } = req.body;
  if (!mealType || !item) {
    res.status(400).json({ error: 'mealType and item are required' });
    return;
  }

  const entry = {
    mealType,
    item,
    calories: calories || 0,
    date: todayKey(),
    loggedAt: new Date().toISOString()
  };

  const docRef = await getDb()
    .collection('users').doc(uid)
    .collection('meals').add(entry);

  res.status(201).json({ id: docRef.id, ...entry });
}

/**
 * deleteMeal
 * Takes :id in the URL. Deletes the matching meal doc.
 */
export async function deleteMeal(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  await getDb()
    .collection('users').doc(uid)
    .collection('meals').doc(String(req.params.id))
    .delete();

  res.json({ ok: true, deleted: req.params.id });
}
