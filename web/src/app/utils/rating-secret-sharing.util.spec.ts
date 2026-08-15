import { CIRCOM_FIELD_SIZE } from './circom-field.util';
import {
  reconstructRating,
  splitRating,
} from './rating-secret-sharing.util';

describe('rating secret sharing util', () => {
  it('splits a rating into three valid field elements', () => {
    const shares = splitRating(5);

    expect(shares.length).toBe(3);
    for (const share of shares) {
      expect(share >= 0n).toBeTrue();
      expect(share < CIRCOM_FIELD_SIZE).toBeTrue();
    }
  });

  it('reconstructs the rating modulo the Circom field', () => {
    for (const rating of [0n, 1n, 5n, CIRCOM_FIELD_SIZE - 1n]) {
      expect(reconstructRating(splitRating(rating))).toBe(rating);
    }
  });

  it('handles field wraparound during reconstruction', () => {
    expect(
      reconstructRating([
        CIRCOM_FIELD_SIZE - 1n,
        CIRCOM_FIELD_SIZE - 1n,
        3n,
      ]),
    ).toBe(1n);
  });

  it('rejects values that are not field elements', () => {
    expect(() => splitRating(-1)).toThrowError(
      'rating must be a non-negative safe integer',
    );
    expect(() => splitRating(1.5)).toThrowError(
      'rating must be a non-negative safe integer',
    );
    expect(() => splitRating(CIRCOM_FIELD_SIZE)).toThrowError(
      'rating must satisfy 0 <= rating < CIRCOM_FIELD_SIZE',
    );
  });
});
