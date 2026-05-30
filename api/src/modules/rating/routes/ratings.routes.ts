import { Router } from 'express';
import { isAuthenticated } from '../../../common/middlewares/auth.middleware';
import { createRatingSchema } from '../schemas/rating.schema';
import { validate } from '../../../common/utils/validator';
import { ratingStartup } from '../rating.setup';
import { verifyProof } from '../middlewares/verify-proof.middleware';

const ratingsController = ratingStartup();

export const ratingRouter = Router();

ratingRouter.post('/', isAuthenticated, validate(createRatingSchema, 'body'), verifyProof, ratingsController.create);
