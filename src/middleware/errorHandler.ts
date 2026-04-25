/**
 * middleware/errorHandler.ts
 * --------------------------
 * Centralised error handler. Catches anything thrown / next(err)'d in any
 * route, logs it server-side, and returns a clean JSON response to the
 * client without leaking the stack trace.
 *
 * Contains:
 *   - errorHandler()  Express error-handling middleware (4 args)
 */

import { Request, Response, NextFunction } from 'express';

// Errors thrown deliberately can carry a custom status — anything else is 500.
interface AppError extends Error {
  status?: number;
  code?: string;
}

/**
 * errorHandler
 * Takes (err, req, res, next). Logs the error, picks an HTTP status, and
 * sends a JSON body { error, code }. Express recognises this as an error
 * handler because it accepts 4 arguments.
 */
export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  const status = err.status || 500;

  // Log full stack server-side, send only message + code to the client.
  console.error('[error]', status, err.message);
  if (status === 500) console.error(err.stack);

  res.status(status).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  });
}
