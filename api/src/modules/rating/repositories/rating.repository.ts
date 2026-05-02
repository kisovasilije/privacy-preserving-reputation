import { Rating } from '../../../generated/prisma/client';
import { prisma } from '../../../lib/prisma';
import { RatingCreation } from '../models/rating/rating-creating.model';

export class RatingRepository {
  public create = async (ratingCreation: RatingCreation): Promise<Rating> => {
    return prisma.rating.create({
      data: { ...ratingCreation },
    });
  };
}
