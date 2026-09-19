import { result, Result } from '../../../common/result';
import { authService } from '../../auth/auth.service';
import { Rating } from '../models/rating/rating.model';
import { RatingRepository } from '../repositories/rating.repository';
import { CreateRatingRequest } from '../schemas/rating.schema';
import { RatingCryptoService } from './rating-crypto.service';
import { roundsService } from './rounds.service';
import { RatingSummary, TrustedAuthoritiesClient } from './trusted-authorities.client';

export class RatingService {
  constructor(
    private readonly ratingRepository: RatingRepository,
    private readonly ratingCryptoService: RatingCryptoService,
    private readonly trustedAuthoritiesClient: TrustedAuthoritiesClient,
  ) {}

  public create = async (request: CreateRatingRequest, authenticatedUserId: number): Promise<Result<Rating>> => {
    const round = await roundsService.getOpenedById(request.roundId);
    if (!round) {
      return result.failure({
        message: 'No opened round found by ID',
        httpStatusCode: 404,
      });
    }

    const target = await authService.getById(request.targetId);
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

    const generated = await this.ratingCryptoService.generateProof({
      rating: request.value,
      roundId: request.roundId,
      raterId: authenticatedUserId,
      targetId: request.targetId,
    });
    const rating = await this.ratingRepository.create({
      comment: request.comment?.trim() || undefined,
      proof: generated.proof,
      publicSignals: generated.publicSignals,
      roundId: request.keepRoundIdAnonymous ? null : request.roundId,
      raterId: request.keepRaterIdAnonymous ? null : authenticatedUserId,
      targetId: request.keepTargetIdAnonymous ? null : request.targetId,
    });

    await this.trustedAuthoritiesClient.submitRatingShares(
      generated.shares,
      request.roundId,
      request.targetId,
    );

    return result.success({ ...rating, comment: rating.comment ?? undefined });
  };

  public getSummary = async (roundId: number, targetId: number): Promise<RatingSummary> => {
    return this.trustedAuthoritiesClient.getRatingSummary(roundId, targetId);
  };
}
