import { Router } from 'express';
import { isAuthenticated } from '../../../common/middlewares/auth.middleware';
import { createRatingSchema } from '../schemas/rating.schema';
import { validate } from '../../../common/utils/validator';
import { ratingStartup } from '../rating.setup';

const ratingsController = ratingStartup();

export const ratingRouter = Router();

ratingRouter.post('/', isAuthenticated, validate(createRatingSchema, 'body'), ratingsController.create);
