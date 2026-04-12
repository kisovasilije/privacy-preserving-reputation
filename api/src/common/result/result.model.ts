export interface Result<TValue = unknown, TError = unknown> {
  success: boolean;
  value: TValue | null;
  error?: TError;
}
