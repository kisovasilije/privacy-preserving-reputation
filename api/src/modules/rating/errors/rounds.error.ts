import { ResultError } from '../../../common/result/result-error.model';

export enum RoundsErrorCode {
  RoundNotFound,
  ForbiddenRound,
  RoundAlreadyClosed,
}

export class RoundsError implements ResultError {
  constructor(
    public message: string,
    public code: RoundsErrorCode,
  ) {}

  public get errorResponseDetails(): { httpStatusCode: number; error: { message: string } } {
    switch (this.code) {
      case RoundsErrorCode.RoundNotFound:
        return { httpStatusCode: 404, error: { message: this.message } };

      case RoundsErrorCode.ForbiddenRound:
        return { httpStatusCode: 403, error: { message: this.message } };

      case RoundsErrorCode.RoundAlreadyClosed:
        return { httpStatusCode: 409, error: { message: this.message } };

      default:
        return { httpStatusCode: 400, error: { message: 'Faild to close round.' } };
    }
  }
}
