import { Request, Response } from 'express';
import { CreateRoundRequest } from './rounds.schemas';
import { roundsService } from './rounds.service';
import { badRequest, created } from '../../common/utils/response.http';

export const roundsController = {
  create: async (req: Request<{}, {}, CreateRoundRequest>, res: Response) => {
    const result = await roundsService.create({ ...req.body, authorId: req.user!.id });
    if (!result.success) {
      return badRequest(res, 'Failed to create round');
    }

    return created(res, result.value);
  },
};
