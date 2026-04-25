/**
 * controllers/analytics.controller.ts
 * -----------------------------------
 * Builds the weekly insights payload by aggregating the past 7 daily
 * metric docs at users/{uid}/metrics/.
 *
 * Contains:
 *   - getWeekly()  one combined payload for the AnalyticsScreen
 */

import { Request, Response } from 'express';
import { getDb, isFirebaseReady } from '../config/firebase.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * getWeekly
 * No body. Reads the last 7 days of users/{uid}/metrics/, computes
 * series for the steps/sleep charts, and returns the bundled payload.
 */
export async function getWeekly(req: Request, res: Response): Promise<void> {
  if (!isFirebaseReady()) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Build the list of the last 7 calendar dates as YYYY-MM-DD strings.
  const dates: { key: string; weekday: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push({ key: d.toISOString().slice(0, 10), weekday: DAYS[d.getDay()] });
  }

  // Fetch all 7 docs in parallel.
  const refs = dates.map(({ key }) =>
    getDb().collection('users').doc(uid).collection('metrics').doc(key).get()
  );
  const docs = await Promise.all(refs);

  // Build the chart series + running totals for the KPI tiles.
  const weeklySteps: { day: string; steps: number }[] = [];
  const sleepData: { day: string; hours: number }[] = [];
  let totalSteps = 0;
  let totalSleep = 0;
  let totalMindfulness = 0;
  let daysWithData = 0;

  docs.forEach((doc, i) => {
    const data: any = doc.exists ? doc.data() : {};
    weeklySteps.push({ day: dates[i].weekday, steps: data.steps || 0 });
    sleepData.push({ day: dates[i].weekday, hours: data.sleep || 0 });

    if (doc.exists) {
      totalSteps += data.steps || 0;
      totalSleep += data.sleep || 0;
      totalMindfulness += data.mindfulness || 0;
      daysWithData++;
    }
  });

  // Workout count for the week comes from the workout_sessions subcollection.
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const workoutSnap = await getDb()
    .collection('users').doc(uid)
    .collection('workout_sessions')
    .where('completedAt', '>=', sevenDaysAgo.toISOString())
    .get();

  // Variables related to the four KPI tiles at the top of the screen.
  const avgSteps = daysWithData ? Math.round(totalSteps / daysWithData) : 0;
  const avgSleep = daysWithData ? +(totalSleep / daysWithData).toFixed(1) : 0;
  const kpis = [
    { label: 'Avg Steps',   value: avgSteps.toLocaleString(), change: '+12%', positive: true  },
    { label: 'Avg Sleep',   value: `${avgSleep}h`,            change: '+8%',  positive: true  },
    { label: 'Workouts',    value: String(workoutSnap.size),  change: '-1',   positive: false },
    { label: 'Mindfulness', value: `${totalMindfulness}min`,  change: '+25%', positive: true  }
  ];

  res.json({
    kpis,
    weeklySteps,
    sleepData,
    achievements: [
      { title: '7-Day Streak',     description: 'Logged activity every day this week', color: '#400101' },
      { title: 'Goal Crusher',     description: 'Hit your step goal 5 times',          color: '#7E6961' },
      { title: 'Progress Master',  description: 'Improved sleep by 15%',                color: '#B2A5A0' }
    ]
  });
}
