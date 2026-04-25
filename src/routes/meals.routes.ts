/**
 * routes/meals.routes.ts
 * ----------------------
 * Meal log — drives the Meal Tracker screen.
 *
 * Endpoints (require auth):
 *   GET   /api/meals                today's meals + macro totals
 *   POST  /api/meals                add a meal entry
 *   DELETE /api/meals/:id           remove a meal entry
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/meals.controller.js';

const router = Router();

router.get('/', requireAuth, ctrl.getToday);
router.post('/', requireAuth, ctrl.addMeal);
router.delete('/:id', requireAuth, ctrl.deleteMeal);

export default router;
