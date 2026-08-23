import { z } from "zod";

const databaseUrlSchema = z
  .string({
    required_error: "DATABASE_URL is required.",
    invalid_type_error: "DATABASE_URL must be a string.",
  })
  .min(1, "DATABASE_URL is required.")
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "postgresql:" || url.protocol === "postgres:";
    } catch {
      return false;
    }
  }, "DATABASE_URL must be a valid PostgreSQL connection URL.");

const environmentSchema = z.object({
  DATABASE_URL: databaseUrlSchema,
  PORT: z.coerce
    .number({
      required_error: "PORT is required.",
      invalid_type_error: "PORT must be an integer between 1 and 65535.",
    })
    .int("PORT must be an integer between 1 and 65535.")
    .min(1, "PORT must be an integer between 1 and 65535.")
    .max(65_535, "PORT must be an integer between 1 and 65535."),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Environment = z.infer<typeof environmentSchema>;

export class EnvironmentValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "EnvironmentValidationError";
  }
}

export function loadEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): Environment {
  const result = environmentSchema.safeParse(source);

  if (!result.success) {
    const messages = result.error.issues.map(
      (issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`,
    );

    throw new EnvironmentValidationError(
      `Invalid environment configuration: ${messages.join("; ")}`,
    );
  }

  return result.data;
}

