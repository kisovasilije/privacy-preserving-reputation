import z from 'zod';
import { createRatingSchema } from '../../schemas/rating.schema';

export type RatingCreation = { raterId: number } & z.infer<typeof createRatingSchema>;
