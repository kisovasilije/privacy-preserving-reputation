import { Prisma, Rating } from '../../../generated/prisma/client';
import { prisma } from '../../../lib/prisma';
import { RatingPersistence } from '../models/rating/rating-persistence.model';

export class RatingRepository {
  public create = async (rating: RatingPersistence): Promise<Rating> => {
    return prisma.rating.create({
      data: {
        comment: rating.comment,
        proof: rating.proof as unknown as Prisma.InputJsonValue,
        publicSignals: rating.publicSignals as Prisma.InputJsonValue,
        raterId: rating.raterId,
        roundId: rating.roundId,
        targetId: rating.targetId,
      },
    });
  };
}
