/**
 * routes/auth.routes.ts
 * ---------------------
 * Authentication endpoints. Note: actual sign-in / sign-up happens on the
 * frontend via Firebase Auth SDK. The backend mainly verifies tokens and
 * creates the matching user document in Firestore.
 *
 * Endpoints:
 *   POST /api/auth/signup    create Firestore user profile after Firebase Auth
 *   POST /api/auth/signin    optional — record last login
 *   POST /api/auth/signout   optional — clear server-side session if any
 */

import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';

const router = Router();

router.post('/signup', ctrl.signup);
router.post('/signin', ctrl.signin);
router.post('/signout', ctrl.signout);

export default router;
