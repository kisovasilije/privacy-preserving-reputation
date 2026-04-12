export interface ResultError {
  message: string;
  readonly errorResponseDetails: { httpStatusCode: number; error: { message: string } };
}

export class Error implements ResultError {
  constructor(public message: string) {}

  public get errorResponseDetails(): { httpStatusCode: number; error: { message: string } } {
    return { httpStatusCode: 400, error: { message: this.message } };
  }
}
