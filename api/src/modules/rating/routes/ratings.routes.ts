import { Router } from 'express';
import { isAuthenticated } from '../../../common/middlewares/auth.middleware';
import { createRatingSchema, ratingSummaryQuerySchema } from '../schemas/rating.schema';
import { validate, withBodyV2 } from '../../../common/utils/validator';
import { ratingStartup } from '../rating.setup';

const ratingsController = ratingStartup();

export const ratingRouter = Router();

ratingRouter.post('/', isAuthenticated, withBodyV2(createRatingSchema, ratingsController.create));

ratingRouter.get(
  '/summary',
  isAuthenticated,
  validate(ratingSummaryQuerySchema, 'query'),
  ratingsController.getSummary,
);
