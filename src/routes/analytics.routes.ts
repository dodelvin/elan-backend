/**
 * routes/analytics.routes.ts
 * --------------------------
 * Weekly insights — drives the Analytics screen.
 *
 * Endpoints (require auth):
 *   GET   /api/analytics/weekly         all charts + KPIs + achievements
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/analytics.controller.js';

const router = Router();

router.get('/weekly', requireAuth, ctrl.getWeekly);

export default router;
