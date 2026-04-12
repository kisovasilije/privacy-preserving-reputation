import { ResultError } from './result-error.model';

export interface Result<TValue = unknown> {
  success: boolean;
  value: TValue | null;
  error?: ResultError;
}
