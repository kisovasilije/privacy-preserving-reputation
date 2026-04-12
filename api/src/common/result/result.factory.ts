import { Result } from './result.model';

export const result = {
  success: <T = unknown>(value: T): Result<T> => ({ success: true, value }),

  failure: <TValue = unknown, TError = unknown>(error: TError): Result<TValue, TError> => ({
    success: false,
    value: null,
    error,
  }),
};
