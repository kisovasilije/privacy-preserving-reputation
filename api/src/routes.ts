import { Router, type Express } from 'express';

import { authRouter } from './modules/auth/auth.routes';
import { router as ratingRouter } from './modules/rating/routes/routes';

export function registerRoutes(app: Express) {
  const v1 = Router();

  v1.use('/auth', authRouter);
  v1.use('/', ratingRouter);

  app.use('/api/v1', v1);
}
