import path from 'node:path';
import { config } from 'dotenv';
import type { StringValue } from 'ms';

const API_ROOT = path.resolve(__dirname, '../..');

config({ path: path.join(API_ROOT, '.env'), quiet: true });

const DEFAULT_TRUSTED_AUTHORITY_URLS = [
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
] as const;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getTrustedAuthorityUrls(): readonly [string, string, string] {
  const configuredUrls = process.env.TRUSTED_AUTHORITY_URLS?.split(',').map(value => value.trim());
  const urls = configuredUrls ?? [...DEFAULT_TRUSTED_AUTHORITY_URLS];

  if (urls.length !== 3 || urls.some(url => !url)) {
    throw new Error('TRUSTED_AUTHORITY_URLS must contain exactly three comma-separated URLs');
  }

  for (const url of urls) {
    let parsed: URL;

    try {
      parsed = new URL(url);
    } catch {
      throw new Error('TRUSTED_AUTHORITY_URLS contains an invalid URL');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('TRUSTED_AUTHORITY_URLS entries must use http or https');
    }
  }

  return urls as [string, string, string];
}

function getPositiveIntegerEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (rawValue === undefined) {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
}

export const environment = {
  DATABASE_URL: getRequiredEnv('DATABASE_URL'),
  PORT: Number(process.env.PORT) || 8080,
  JWT_SECRET: getRequiredEnv('JWT_SECRET'),
  JWT_ISSUER: process.env.JWT_ISSUER,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE,
  JWT_EXPIRATION: getRequiredEnv('JWT_EXPIRATION') as StringValue,
  TRUSTED_AUTHORITY_URLS: getTrustedAuthorityUrls(),
  TRUSTED_AUTHORITY_TIMEOUT_MS: getPositiveIntegerEnv('TRUSTED_AUTHORITY_TIMEOUT_MS', 10_000),
  ZK_ARTIFACTS_DIR: path.resolve(API_ROOT, process.env.ZK_ARTIFACTS_DIR?.trim() || 'zk-artifacts/rating/v1'),
};
