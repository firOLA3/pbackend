import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { ZodError } from 'zod';
import { ENV } from './config/env.js';
import exerciseRoutes from './routes/exercise.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import workoutRoutes from './routes/workout.routes.js';
import programRoutes from './routes/program.routes.js';
import planRoutes from './routes/plan.routes.js';
import notificationRoutes from './routes/notification.routes.js';

export const createApp = () => {
  const app = express();

  // Security & utility middleware
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin: [ENV.CLIENT_URL, 'http://localhost:8081', 'http://localhost:19006', '*'],
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve static assets (exercise illustrations, animations, videos)
  app.use('/static', express.static(path.join(process.cwd(), 'public')));

  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health check routes
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'pulsefit-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'pulsefit-api',
      environment: ENV.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/exercises', exerciseRoutes);
  app.use('/api/workouts', workoutRoutes);
  app.use('/api/programs', programRoutes);
  app.use('/api/plans', planRoutes);
  app.use('/api/notifications', notificationRoutes);

  // 404 Route
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Handle Zod validation errors
    if (err instanceof ZodError || err.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: err.errors?.[0]?.message || 'Validation error',
        errors: err.errors,
      });
      return;
    }

    console.error('Unhandled error:', err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Internal Server Error',
      ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
    });
  });

  return app;
};

