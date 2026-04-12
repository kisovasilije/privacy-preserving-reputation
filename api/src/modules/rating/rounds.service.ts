import { result, Result } from '../../common/result';
import { Round } from '../../generated/prisma/client';
import { RoundsError, RoundsErrorCode } from './errors/rounds.error';
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

  close: async (roundId: number, userId: number): Promise<Result<Round | null>> => {
    const round = await roundsRepository.getById(roundId);
    if (!round) {
      return result.failure(new RoundsError('Round not found', RoundsErrorCode.RoundNotFound));
    }

    if (round.authorId !== userId) {
      return result.failure(new RoundsError('You are not the owner of this round', RoundsErrorCode.ForbiddenRound));
    }

    if (new Date() >= round.closesAt) {
      return result.failure(new RoundsError('Round is already closed', RoundsErrorCode.RoundAlreadyClosed));
    }

    round.closesAt = new Date();
    const updatedRound = await roundsRepository.close(round);
    return result.success(updatedRound);
  },
};
