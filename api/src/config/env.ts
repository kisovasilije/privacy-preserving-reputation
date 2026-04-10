import 'dotenv/config';
import type { StringValue } from 'ms';

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const environment = {
  PORT: Number(process.env.PORT) || 8080,
  JWT_SECRET: getRequiredEnv('JWT_SECRET'),
  JWT_ISSUER: process.env.JWT_ISSUER,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE,
  JWT_EXPIRATION: getRequiredEnv('JWT_EXPIRATION') as StringValue,
};
