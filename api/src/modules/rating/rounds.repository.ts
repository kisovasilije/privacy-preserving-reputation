import { Round } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { CreateRound } from './models/create-round.model';

export const roundsRepository = {
  create: (round: CreateRound): Promise<Round> => {
    return prisma.round.create({
      data: { ...round },
    });
  },
};
