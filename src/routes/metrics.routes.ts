/**
 * routes/metrics.routes.ts
 * ------------------------
 * Daily wellness metrics — what the Tracker screen reads/writes.
 *
 * Endpoints (require auth):
 *   GET    /api/metrics/today        today's tracker values
 *   POST   /api/metrics/today        upsert today's values
 *   GET    /api/metrics/home         home-screen overview (stats + goals)
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/metrics.controller.js';

const router = Router();

router.get('/today', requireAuth, ctrl.getToday);
router.post('/today', requireAuth, ctrl.saveToday);
router.get('/home', requireAuth, ctrl.getHomeOverview);

export default router;
