export interface ErrorDetail {
  field: string;
  message: string;
}

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: readonly ErrorDetail[] | undefined;

  public constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: readonly ErrorDetail[],
  ) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

