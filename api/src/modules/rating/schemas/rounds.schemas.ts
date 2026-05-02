import { z } from 'zod';

const isoDatetime = z.iso.datetime();

export const createRoundSchema = z
  .object({
    title: z.string().trim().min(3).max(128),
    description: z.string().trim().max(1024).optional(),
    opensAt: isoDatetime.optional(),
    closesAt: isoDatetime,
  })
  .superRefine((round, ctx) => {
    const closesAt = new Date(round.closesAt);
    if (Number.isNaN(closesAt.getTime())) {
      ctx.addIssue({
        code: 'custom',
        path: ['closesAt'],
        message: 'Invalid closesAt datetime',
      });
    }

    if (round.opensAt == null && closesAt <= new Date()) {
      ctx.addIssue({
        code: 'custom',
        path: ['closesAt'],
        message: 'closesAt must be in the future',
      });
    }

    if (round.opensAt != null) {
      const opensAt = new Date(round.opensAt);
      if (Number.isNaN(opensAt.getTime())) {
        ctx.addIssue({
          code: 'custom',
          path: ['opensAt'],
          message: 'Invalid opensAt datetime',
        });
      }

      if (closesAt <= opensAt) {
        ctx.addIssue({
          code: 'custom',
          path: ['closesAt'],
          message: 'closesAt must be after opensAt',
        });
      }
    }
  });

export type CreateRoundRequest = z.infer<typeof createRoundSchema> & { authorId: number };

export const closeRoundParamsSchema = z.object({
  roundId: z.string().refine(
    id => {
      const num = Number(id);
      return !Number.isNaN(num) && num > 0;
    },
    { error: 'Must be a positive integer' },
  ),
});
