/**
 * routes/workouts.routes.ts
 * -------------------------
 * Workout catalog + completion logging.
 *
 * Endpoints (require auth):
 *   GET   /api/workouts             catalog
 *   POST  /api/workouts/sessions    log a completed session
 *   GET   /api/workouts/sessions    weekly stats (time/calories/count)
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/workouts.controller.js';

const router = Router();

router.get('/', requireAuth, ctrl.getCatalog);
router.post('/sessions', requireAuth, ctrl.logSession);
router.get('/sessions', requireAuth, ctrl.getWeeklyStats);

export default router;
