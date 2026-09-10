import { z } from "zod";

import {
  BN254_SCALAR_FIELD_MODULUS,
  POSTGRES_INTEGER_MAX,
} from "../constants/numeric.js";

const BASE_TEN_INTEGER_PATTERN = /^[0-9]+$/;

const positiveIdentifierSchema = z
  .number({
    required_error: "A positive integer is required.",
    invalid_type_error: "Must be a number.",
  })
  .int("Must be an integer.")
  .min(1, "Must be greater than zero.")
  .max(
    POSTGRES_INTEGER_MAX,
    "Must fit in a signed PostgreSQL INTEGER.",
  );

const positiveIdentifierQuerySchema = z
  .string({
    required_error: "A positive integer query parameter is required.",
    invalid_type_error: "Must be provided exactly once.",
  })
  .regex(BASE_TEN_INTEGER_PATTERN, "Must contain only base-10 digits.")
  .transform(Number)
  .pipe(positiveIdentifierSchema);

const fieldElementSchema = z
  .string({
    required_error: "A base-10 field-element string is required.",
    invalid_type_error: "Must be a base-10 field-element string.",
  })
  .superRefine((value, context) => {
    if (!BASE_TEN_INTEGER_PATTERN.test(value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Must contain only base-10 digits.",
      });
      return;
    }

    const parsed = BigInt(value);

    if (parsed >= BN254_SCALAR_FIELD_MODULUS) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Must be smaller than the BN254 scalar-field modulus.",
      });
    }
  })
  .transform((value) => BigInt(value));

export const createShareSchema = z
  .object({
    ratingId: positiveIdentifierSchema,
    share: fieldElementSchema,
    targetId: positiveIdentifierSchema,
    roundId: positiveIdentifierSchema,
  })
  .strict("Unexpected fields are not allowed.");

export const aggregateSharesQuerySchema = z
  .object({
    roundId: positiveIdentifierQuerySchema,
    targetId: positiveIdentifierQuerySchema,
  })
  .strict("Unexpected query parameters are not allowed.");
