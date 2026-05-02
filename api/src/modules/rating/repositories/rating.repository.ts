import { Prisma, Rating } from '../../../generated/prisma/client';
import { prisma } from '../../../lib/prisma';
import { RatingCreation } from '../models/rating/rating-creating.model';

export class RatingRepository {
  public create = async (
    ratingCreation: RatingCreation,
    upsertAggregateFn: (tx: Prisma.TransactionClient, rating: Rating) => Promise<void>,
  ): Promise<Rating> => {
    // return prisma.rating.create({
    //   data: { ...ratingCreation },
    // });

    return prisma.$transaction(
      async tx => {
        const rating = await tx.rating.create({
          data: { ...ratingCreation },
        });

        await upsertAggregateFn(tx, rating);

        return rating;
      },
      {
        maxWait: 300_000,
        timeout: 600_000,
      },
    );
  };

  private random = async () => {
    // const result = await prisma.$transaction(async tx => {
    //   tx.agg
    // })
  };
}
