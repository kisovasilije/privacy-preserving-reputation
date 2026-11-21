import z from 'zod';

const POSTGRES_INTEGER_MAX = 2_147_483_647;
const positiveIdentifierSchema = z.number().int().positive().max(POSTGRES_INTEGER_MAX);

export const createRatingSchema = z
  .object({
    value: z.number().int().min(1).max(5),
    roundId: positiveIdentifierSchema,
    targetId: positiveIdentifierSchema,
    comment: z.string().trim().max(1024).optional(),
    keepRaterIdAnonymous: z.boolean(),
    keepTargetIdAnonymous: z.boolean(),
    keepRoundIdAnonymous: z.boolean(),
  })
  .strict();

export type CreateRatingRequest = z.infer<typeof createRatingSchema>;

export const ratingSummaryQuerySchema = z
  .object({
    roundId: z
      .string()
      .regex(/^[1-9]\d*$/, 'Must be a positive base-10 integer')
      .refine(value => Number(value) <= POSTGRES_INTEGER_MAX, 'Must fit in a PostgreSQL integer'),
  })
  .strict();

export type RatingSummaryQuery = z.infer<typeof ratingSummaryQuerySchema>;
