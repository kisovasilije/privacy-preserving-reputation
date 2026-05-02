import { Router } from 'express';
import { roundsRouter } from './rounds.routes';
import { ratingRouter } from './ratings.routes';

export const router = Router();

router.use('/rounds', roundsRouter);
router.use('/ratings', ratingRouter);
