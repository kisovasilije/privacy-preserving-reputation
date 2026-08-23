import { result, Result } from '../../../common/result';
import { authService } from '../../auth/auth.service';
import { RatingCreation } from '../models/rating/rating-creating.model';
import { Rating } from '../models/rating/rating.model';
import { RatingRepository } from '../repositories/rating.repository';
import { roundsService } from './rounds.service';

export class RatingService {
  constructor(private readonly ratingRepository: RatingRepository) {}

  public create = async (
    ratingCreation: RatingCreation,
    authenticatedUserId: number,
  ): Promise<Result<Rating>> => {
    const proofContext = this.getProofContext(ratingCreation.publicSignals);
    if (!proofContext) {
      return result.failure({
        message: 'Proof context contains invalid identifiers',
        httpStatusCode: 422,
      });
    }

    if (proofContext.raterId !== authenticatedUserId) {
      return result.failure({
        message: 'Proof rater does not match the authenticated user',
        httpStatusCode: 403,
      });
    }

    if (
      (ratingCreation.roundId !== undefined &&
        ratingCreation.roundId !== proofContext.roundId) ||
      (ratingCreation.raterId !== undefined &&
        ratingCreation.raterId !== proofContext.raterId) ||
      (ratingCreation.targetId !== undefined && ratingCreation.targetId !== proofContext.targetId)
    ) {
      return result.failure({
        message: 'Disclosed rating identifiers do not match the proof',
        httpStatusCode: 422,
      });
    }

    const round = await roundsService.getOpenedById(proofContext.roundId);
    if (!round) {
      return result.failure({
        message: 'No opened round found by ID',
        httpStatusCode: 404,
      });
    }

    const target = await authService.getById(proofContext.targetId);
    if (!target) {
      return result.failure({
        message: 'Target user not found',
        httpStatusCode: 404,
      });
    }

    if (target.id === authenticatedUserId) {
      return result.failure({
        message: 'You cannot rate yourself',
        httpStatusCode: 400,
      });
    }

    const rating = await this.ratingRepository.create(ratingCreation);
    return result.success({ ...rating, comment: rating.comment ?? undefined });
  };

  private getProofContext(publicSignals: string[]): {
    roundId: number;
    raterId: number;
    targetId: number;
  } | null {
    const [roundId, raterId, targetId] = publicSignals.map(Number);

    if (
      !Number.isSafeInteger(roundId) ||
      roundId <= 0 ||
      !Number.isSafeInteger(raterId) ||
      raterId <= 0 ||
      !Number.isSafeInteger(targetId) ||
      targetId <= 0
    ) {
      return null;
    }

    return { roundId, raterId, targetId };
  }
}
