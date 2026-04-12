import { result, Result } from '../../common/result';
import { Round } from '../../generated/prisma/client';
import { OpenedRounds } from './models/opened-rounds.model';
import { roundsRepository } from './rounds.repository';
import { CreateRoundRequest } from './rounds.schemas';

export const roundsService = {
  create: async (request: CreateRoundRequest): Promise<Result> => {
    if (request.opensAt == null) {
      request.opensAt = new Date().toISOString();
    }

    const round = await roundsRepository.create({
      title: request.title,
      description: request.description,
      opensAt: request.opensAt,
      closesAt: request.closesAt,
      authorId: request.authorId,
    });

    return result.success(round);
  },

  getOpened: async (): Promise<Result<OpenedRounds>> => {
    const rounds = await roundsRepository.getOpened();
    return result.success(rounds);
  },

  close: async (roundId: number, userId: number): Promise<Result<Round>> => {
    const round = await roundsRepository.getById(roundId);
    if (!round) {
      return result.failure({
        message: 'Round not found',
        errorCode: 'ROUND_NOT_FOUND',
      });
    }

    if (round.authorId !== userId) {
      return result.failure({
        message: 'You are not the owner of this round',
        errorCode: 'FORBIDDEN',
      });
    }

    if (new Date() >= round.closesAt) {
      return result.failure({
        message: 'Round is already closed',
        errorCode: 'ROUND_ALREADY_CLOSED',
      });
    }

    round.closesAt = new Date();
    const updatedRound = await roundsRepository.close(round);
    return result.success(updatedRound);
  },
};
