import { Router } from 'express';
import { roundsRouter } from './rounds.routes';

export const ratingRouter = Router();

ratingRouter.use('/rounds', roundsRouter);
