import { result, Result } from '../../common/result';
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
};
