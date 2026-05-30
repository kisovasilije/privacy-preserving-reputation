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

const publicSignalsSchema = z.array(decimalStringSchema).length(4);

export const createRatingSchema = z
  .object({
    value: z.number().int().min(1).max(5),
    commitment: z.string(),
    comment: z.string().trim().max(1024).optional(),
    roundId: z.number().int().positive(),
    targetId: z.number().int().positive(),
    proof: groth16ProofSchema,
    publicSignals: publicSignalsSchema,
  })
  .strict();
