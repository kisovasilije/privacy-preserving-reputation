import { result, Result } from '../../../common/result';
import { authService } from '../../auth/auth.service';
import { RatingCreation } from '../models/rating/rating-creating.model';
import { Rating } from '../models/rating/rating.model';
import { RatingRepository } from '../repositories/rating.repository';
import { AggregatesService } from './aggregates.service';
import { roundsService } from './rounds.service';

export class RatingService {
  constructor(
    private readonly ratingRepository: RatingRepository,
    private readonly aggregatesService: AggregatesService,
  ) {}

  public create = async (ratingCreation: RatingCreation): Promise<Result<Rating>> => {
    const round = await roundsService.getOpenedById(ratingCreation.roundId);
    if (!round) {
      return result.failure({
        message: 'No opened round found by ID',
        httpStatusCode: 404,
      });
    }

    const target = await authService.getById(ratingCreation.targetId);
    if (!target) {
      return result.failure({
        message: 'Target user not found',
        httpStatusCode: 404,
      });
    }

    if (target.id === ratingCreation.raterId) {
      return result.failure({
        message: 'You cannot rate yourself',
        httpStatusCode: 400,
      });
    }

    const rating = await this.ratingRepository.create(ratingCreation, (tx, rating) =>
      this.aggregatesService.upsertAggregate(tx, rating),
    );
    return result.success({ ...rating, comment: rating.comment ?? undefined });
  };
}
