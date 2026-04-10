import { Result } from './result.model';

export const result = {
  success: <T = unknown>(value: T): Result<T> => ({ success: true, value }),

  failure: (error: string): Result => ({ success: false, value: null, error }),
};
