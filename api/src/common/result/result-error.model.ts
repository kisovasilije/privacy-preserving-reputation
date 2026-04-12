export interface ResultError {
  message: string;
  readonly errorResponseDetails: { httpStatusCode: number; error: { message: string } };
}
