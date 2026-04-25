/**
 * index.ts
 * --------
 * Express server entry point. Loads env vars, initialises Firebase, mounts
 * middleware (CORS + JSON parser + auth), wires the route modules under
 * /api, and starts listening on PORT.
 *
 * Contains:
 *   - app                 the Express instance
 *   - default export      not used — server starts on import
 *   - startServer()       boots the HTTP listener
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { initFirebase } from './config/firebase.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route modules — one per resource group.
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import mealsRoutes from './routes/meals.routes.js';
import workoutsRoutes from './routes/workouts.routes.js';
import meditationsRoutes from './routes/meditations.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import communityRoutes from './routes/community.routes.js';
import shopRoutes from './routes/shop.routes.js';

// Variables related to env / boot configuration
dotenv.config();
const PORT = Number(process.env.PORT) || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// Initialise Firebase Admin SDK once at startup.
initFirebase();

const app = express();

// Variables related to global middleware
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Health-check route — handy for confirming the server is up.
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'elan-backend' });
});

// Mount feature routes under /api.
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/meals', mealsRoutes);
app.use('/api/workouts', workoutsRoutes);
app.use('/api/meditations', meditationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/shop', shopRoutes);

// 404 fallback — anything that doesn't match a route above.
app.use((req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Centralised error handler — must be last.
app.use(errorHandler);

/**
 * startServer
 * No arguments. Begins listening on PORT and logs the URL.
 */
function startServer() {
  app.listen(PORT, () => {
    console.log(`[elan-backend] listening on http://localhost:${PORT}`);
    console.log(`[elan-backend] CORS origin: ${FRONTEND_ORIGIN}`);
  });
}

startServer();
