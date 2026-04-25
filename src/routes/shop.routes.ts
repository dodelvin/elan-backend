/**
 * routes/shop.routes.ts
 * ---------------------
 * Wellness shop product catalog.
 *
 * Endpoints (require auth):
 *   GET   /api/shop/products     full product list
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/shop.controller.js';

const router = Router();

router.get('/products', requireAuth, ctrl.getProducts);

export default router;
