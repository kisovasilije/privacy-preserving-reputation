import z from 'zod';

const decimalStringSchema = z.string().regex(/^(0|[1-9]\d*)$/, 'Must be an unsigned decimal string');

const groth16ProofSchema = z.object({
  pi_a: z.tuple([decimalStringSchema, decimalStringSchema, decimalStringSchema]),
  pi_b: z.tuple([
    z.tuple([decimalStringSchema, decimalStringSchema]),
    z.tuple([decimalStringSchema, decimalStringSchema]),
    z.tuple([decimalStringSchema, decimalStringSchema]),
  ]),
  pi_c: z.tuple([decimalStringSchema, decimalStringSchema, decimalStringSchema]),
  protocol: z.literal('groth16'),
  curve: z.literal('bn128'),
});

const publicSignalsSchema = z.array(decimalStringSchema).length(7);

export const createRatingSchema = z
  .object({
    commitment: z.string(),
    comment: z.string().trim().max(1024).optional(),
    roundId: z.number().int().positive().optional(),
    raterId: z.number().int().positive().optional(),
    targetId: z.number().int().positive().optional(),
    proof: groth16ProofSchema,
    publicSignals: publicSignalsSchema,
  })
  .strict();
