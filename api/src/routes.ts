import { Router, type Express } from 'express';

import { authRouter } from './modules/auth/auth.routes';

export function registerRoutes(app: Express) {
  const v1 = Router();

  v1.use('/auth', authRouter);

  app.use('/api/v1', v1);
}
