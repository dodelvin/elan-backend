/**
 * routes/users.routes.ts
 * ----------------------
 * Current-user profile endpoints.
 *
 * Endpoints (all require auth):
 *   GET   /api/users/me       full profile (stats, badges, lifetime totals)
 *   PUT   /api/users/me       update display name / preferences
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/users.controller.js';

const router = Router();

router.get('/me', requireAuth, ctrl.getMe);
router.put('/me', requireAuth, ctrl.updateMe);

export default router;
