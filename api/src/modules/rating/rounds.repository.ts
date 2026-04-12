import { Round } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { CreateRound } from './models/create-round.model';

export const roundsRepository = {
  create: (round: CreateRound): Promise<Round> => {
    return prisma.round.create({
      data: { ...round },
    });
  },

  getOpened: (): Promise<Round[]> => {
    const now = new Date();

    return prisma.round.findMany({
      where: {
        opensAt: { lte: now },
        closesAt: { gte: now },
      },
    });
  },

  getById: (id: number): Promise<Round | null> => {
    return prisma.round.findUnique({ where: { id } });
  },

  close: (round: Round): Promise<Round> => {
    return prisma.round.update({
      where: { id: round.id },
      data: { closesAt: round.closesAt },
    });
  },
};
