import { ResultError } from './result-error.model';
import { Result } from './result.model';

export const result = {
  success: <T = unknown>(value: T): Result<T> => ({ success: true, value }),

  failure: (error: ResultError) => ({
    success: false,
    value: null,
    error,
  }),
};
