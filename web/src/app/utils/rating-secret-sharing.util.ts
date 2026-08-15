import {
  CIRCOM_FIELD_SIZE,
  toCircomField,
} from './circom-field.util';

export type RatingShares = readonly [bigint, bigint, bigint];

const FIELD_ELEMENT_BYTES = 32;

function bytesToBigInt(bytes: Uint8Array): bigint {
  let value = 0n;

  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }

  return value;
}

/**
 * Samples uniformly from Circom's BN254 scalar field.
 *
 * Rejection sampling is important here: reducing a random 256-bit integer
 * modulo the field size would introduce modulo bias.
 */
function randomFieldElement(): bigint {
  const bytes = new Uint8Array(FIELD_ELEMENT_BYTES);

  while (true) {
    crypto.getRandomValues(bytes);
    // Limit the sample to 254 bits; BN254's scalar modulus is 254 bits.
    bytes[0] &= 0x3f;
    const candidate = bytesToBigInt(bytes);

    if (candidate < CIRCOM_FIELD_SIZE) {
      return candidate;
    }
  }
}

function ratingToFieldElement(rating: number | bigint): bigint {
  if (
    typeof rating === 'number' &&
    (!Number.isSafeInteger(rating) || rating < 0)
  ) {
    throw new Error('rating must be a non-negative safe integer');
  }

  const value = BigInt(rating);

  if (value < 0n || value >= CIRCOM_FIELD_SIZE) {
    throw new Error('rating must satisfy 0 <= rating < CIRCOM_FIELD_SIZE');
  }

  return value;
}

/**
 * Splits a rating into three additive shares in Circom's field.
 * Any two shares reveal no information about the rating.
 */
export function splitRating(rating: number | bigint): RatingShares {
  const secret = ratingToFieldElement(rating);
  const first = randomFieldElement();
  const second = randomFieldElement();
  const third = toCircomField(secret - first - second);

  return [first, second, third];
}

/** Reconstructs the original field element from its three shares. */
export function reconstructRating(shares: RatingShares): bigint {
  return toCircomField(shares[0] + shares[1] + shares[2]);
}
