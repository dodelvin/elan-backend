/**
 * routes/meditations.routes.ts
 * ----------------------------
 * Meditation catalog + completion logging.
 *
 * Endpoints (require auth):
 *   GET   /api/meditations              full catalog
 *   GET   /api/meditations/:id          single session details
 *   POST  /api/meditations/sessions     log a completed session
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/meditations.controller.js';

const router = Router();

router.get('/', requireAuth, ctrl.getCatalog);
router.get('/:id', requireAuth, ctrl.getById);
router.post('/sessions', requireAuth, ctrl.logSession);

export default router;
