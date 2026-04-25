/**
 * routes/community.routes.ts
 * --------------------------
 * Social feed: posts, likes, comments, and active challenges.
 *
 * Endpoints (require auth):
 *   GET   /api/community/posts                  feed
 *   POST  /api/community/posts                  create post
 *   POST  /api/community/posts/:id/like         toggle like
 *   POST  /api/community/posts/:id/comments     add comment
 *   GET   /api/community/challenges             active challenges
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/community.controller.js';

const router = Router();

router.get('/posts', requireAuth, ctrl.getPosts);
router.post('/posts', requireAuth, ctrl.createPost);
router.post('/posts/:id/like', requireAuth, ctrl.toggleLike);
router.post('/posts/:id/comments', requireAuth, ctrl.addComment);
router.get('/challenges', requireAuth, ctrl.getChallenges);

export default router;
