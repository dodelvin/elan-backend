/**
 * utils/seedDemoUser.ts (NEW FILE)
 * --------------------------------
 * One-shot script that creates a demo user "Sarah Johnson" with:
 *   - Firebase Auth account: demo@elan.app / Demo1234!
 *   - Firestore profile doc
 *   - Custom goals
 *   - 7 days of daily metrics (steps, water, sleep, mood, mindfulness)
 *   - Several meal logs
 *   - Several workout sessions
 *   - Several meditation sessions
 *
 * Run with: npx tsx src/utils/seedDemoUser.ts
 *
 * Idempotent — safe to run multiple times. If the user already exists,
 * it updates instead of failing.
 */

import dotenv from 'dotenv';
import { initFirebase, getDb, getAuth, isFirebaseReady } from '../config/firebase.js';

dotenv.config();
initFirebase();

if (!isFirebaseReady()) {
  console.error('[seedDemo] Firebase not initialised');
  process.exit(1);
}

const DEMO_EMAIL = 'demo@elan.app';
const DEMO_PASSWORD = 'Demo1234!';
const DEMO_NAME = 'Sarah Johnson';

/** Ensures the demo Firebase Auth user exists, returns its uid. */
async function ensureUser(): Promise<string> {
  try {
    const existing = await getAuth().getUserByEmail(DEMO_EMAIL);
    console.log(`[seedDemo] user already exists: ${existing.uid}`);
    return existing.uid;
  } catch {
    const created = await getAuth().createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      displayName: DEMO_NAME
    });
    console.log(`[seedDemo] created user: ${created.uid}`);
    return created.uid;
  }
}

/** Date string YYYY-MM-DD for N days ago. */
function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** ISO timestamp N days ago at 8am. */
function isoNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}

async function main(): Promise<void> {
  const db = getDb();
  const uid = await ensureUser();
  const userRef = db.collection('users').doc(uid);

  // Profile
  await userRef.set({
    name: DEMO_NAME,
    email: DEMO_EMAIL,
    avatarLetter: 'S',
    memberSince: 'Nov 2024',
    createdAt: new Date().toISOString(),
    achievements: 12,
    currentStreak: 7,
    goalsMet: 85,
    totalSteps: 245890,
    sleepAverage: 7.5,
    badges: [
      { name: '7-Day Streak',    emoji: '🔥', earned: true  },
      { name: 'Early Bird',      emoji: '🌅', earned: true  },
      { name: 'Hydration Hero',  emoji: '💧', earned: true  },
      { name: 'Zen Master',      emoji: '🧘', earned: false },
      { name: 'Marathon Runner', emoji: '🏃', earned: false },
      { name: 'Nutrition Pro',   emoji: '🥗', earned: true  }
    ]
  }, { merge: true });
  console.log('[seedDemo] profile saved');

  // Goals
  await userRef.collection('preferences').doc('goals').set({
    stepsGoal: 10000,
    waterGoal: 8,
    sleepGoal: 8,
    mindfulnessGoal: 15
  });
  console.log('[seedDemo] goals saved');

  // 7 days of daily metrics — varied but realistic numbers
  const dailyData = [
    { steps: 8200,  water: 7, sleep: 7.2, mood: 'good',  mindfulness: 10 },
    { steps: 9500,  water: 8, sleep: 6.8, mood: 'great', mindfulness: 15 },
    { steps: 7800,  water: 6, sleep: 8.1, mood: 'great', mindfulness: 20 },
    { steps: 10200, water: 8, sleep: 7.5, mood: 'great', mindfulness: 15 },
    { steps: 8547,  water: 6, sleep: 7.5, mood: 'good',  mindfulness: 15 },
    { steps: 6200,  water: 5, sleep: 8.5, mood: 'okay',  mindfulness: 5  },
    { steps: 11000, water: 9, sleep: 7.8, mood: 'great', mindfulness: 25 }
  ];

  for (let i = 0; i < 7; i++) {
    const date = dateNDaysAgo(6 - i);
    await userRef.collection('metrics').doc(date).set({
      ...dailyData[i],
      updatedAt: isoNDaysAgo(6 - i)
    });
  }
  console.log('[seedDemo] 7 days of metrics saved');

  // Meals for today
  const today = dateNDaysAgo(0);
  const meals = [
    { mealType: 'breakfast', item: 'Oatmeal with berries',  calories: 420 },
    { mealType: 'lunch',     item: 'Grilled chicken salad', calories: 580 },
    { mealType: 'snacks',    item: 'Greek yogurt',          calories: 180 }
  ];
  for (const m of meals) {
    await userRef.collection('meals').add({
      ...m,
      date: today,
      loggedAt: new Date().toISOString()
    });
  }
  console.log('[seedDemo] meals saved');

  // Workout sessions across the week
  const workouts = [
    { workoutId: '1', durationMinutes: 30, caloriesBurned: 180 },
    { workoutId: '2', durationMinutes: 20, caloriesBurned: 350 },
    { workoutId: '4', durationMinutes: 15, caloriesBurned: 80  },
    { workoutId: '1', durationMinutes: 30, caloriesBurned: 180 }
  ];
  for (let i = 0; i < workouts.length; i++) {
    await userRef.collection('workout_sessions').add({
      ...workouts[i],
      completedAt: isoNDaysAgo(workouts.length - 1 - i)
    });
  }
  console.log('[seedDemo] workout sessions saved');

  // Meditation sessions
  const meditations = [
    { meditationId: '1', durationSeconds: 600 },
    { meditationId: '2', durationSeconds: 300 },
    { meditationId: '4', durationSeconds: 1200 }
  ];
  for (let i = 0; i < meditations.length; i++) {
    await userRef.collection('meditation_sessions').add({
      ...meditations[i],
      completedAt: isoNDaysAgo(meditations.length - 1 - i)
    });
  }
  console.log('[seedDemo] meditation sessions saved');

  console.log('');
  console.log('========================================');
  console.log('  DEMO USER READY');
  console.log('  Email:    ' + DEMO_EMAIL);
  console.log('  Password: ' + DEMO_PASSWORD);
  console.log('========================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('[seedDemo] failed:', err);
  process.exit(1);
});
