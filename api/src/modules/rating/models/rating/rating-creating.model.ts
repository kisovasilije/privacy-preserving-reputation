import z from 'zod';
import { createRatingSchema } from '../../schemas/rating.schema';

export type RatingCreation = z.infer<typeof createRatingSchema>;
