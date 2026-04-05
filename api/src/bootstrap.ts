import express from 'express';
import { registerRoutes } from './routes';
import helmet from 'helmet';
import cors from 'cors';

export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  registerRoutes(app);

  return app;
}
