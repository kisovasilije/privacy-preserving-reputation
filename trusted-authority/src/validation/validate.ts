import type { z } from "zod";

import { HttpError } from "../errors/http-error.js";

export function validate<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  value: unknown,
  source: "body" | "query",
): z.output<TSchema> {
  const result = schema.safeParse(value);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field:
        issue.path.length > 0
          ? `${source}.${issue.path.map(String).join(".")}`
          : source,
      message: issue.message,
    }));

    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Request validation failed.",
      details,
    );
  }

  return result.data;
}

