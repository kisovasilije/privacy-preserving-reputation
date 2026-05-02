import { Aggregate, Prisma, Rating } from '../../../generated/prisma/client';

export class AggregatesRepository {
  constructor() {}

  public upsertAggregate = async (tx: Prisma.TransactionClient, rating: Rating) => {
    const { roundId, targetId, value } = rating;

    const oldAggregate = await tx.aggregate.findUnique({
      where: {
        roundId_targetId: {
          roundId,
          targetId,
        },
      },
    });

    let newAggregate: Aggregate;
    if (!oldAggregate) {
      newAggregate = await tx.aggregate.create({
        data: {
          count: 1,
          sum: value,
          average: value,
          roundId: roundId,
          targetId: targetId,
        },
      });

      return;
    }

    const newCount = oldAggregate.count + 1;
    const newSum = oldAggregate.sum + value;
    const newAverage = newSum / newCount;

    newAggregate = await tx.aggregate.update({
      where: { roundId_targetId: { roundId, targetId } },
      data: {
        count: newCount,
        sum: newSum,
        average: newAverage,
      },
    });
  };
}
