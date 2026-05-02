import { Prisma, Rating } from '../../../generated/prisma/client';
import { AggregatesRepository } from '../repositories/aggregates.repository';

export class AggregatesService {
  constructor(private readonly aggregatesRepository: AggregatesRepository) {}

  public upsertAggregate = async (tx: Prisma.TransactionClient, rating: Rating) => {
    return this.aggregatesRepository.upsertAggregate(tx, rating);
  };
}
