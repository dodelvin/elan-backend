/**
 * routes/users.routes.ts (UPDATED)
 * --------------------------------
 * Adds GET/PUT /api/users/me/goals to the existing users router.
 * Replace your current users.routes.ts with this file.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as users from '../controllers/users.controller.js';
import * as goals from '../controllers/goals.controller.js';

const router = Router();

router.get('/me', requireAuth, users.getMe);
router.put('/me', requireAuth, users.updateMe);

router.get('/me/goals', requireAuth, goals.getGoals);
router.put('/me/goals', requireAuth, goals.updateGoals);

export default router;
