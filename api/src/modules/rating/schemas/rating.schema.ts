import z from 'zod';

export const createRatingSchema = z.object({
  value: z.number().min(1).max(5),
  commitment: z.string(),
  comment: z.string().trim().max(1024).optional(),
  roundId: z.number().int().positive(),
  targetId: z.number().int().positive(),
});
