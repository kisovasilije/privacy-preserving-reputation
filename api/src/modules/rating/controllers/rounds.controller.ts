import { Request, Response } from 'express';
import { CreateRoundRequest } from '../schemas/rounds.schemas';
import { roundsService } from '../services/rounds.service';
import { badRequest, created, ok } from '../../../common/utils/response.http';
import { OpenedRounds } from '../models/opened-rounds.model';

export const roundsController = {
  create: async (req: Request<{}, {}, CreateRoundRequest>, res: Response) => {
    const result = await roundsService.create({ ...req.body, authorId: req.user!.id });
    if (!result.success) {
      return badRequest(res, 'Failed to create round');
    }

    return created(res, result.value);
  },

  getOpened: async (_: Request, res: Response<OpenedRounds>) => {
    const result = await roundsService.getOpened();
    if (!result.success) {
      return badRequest(res, 'Failed to fetch opened rounds');
    }

    return res.status(200).json(result.value ?? []);
  },

  close: async (req: Request<{ roundId: string }>, res: Response) => {
    const roundId = Number(req.params.roundId);
    const userId = req.user!.id;

    const result = await roundsService.close(roundId, userId);
    if (result.success) {
      return ok(res, result.value!);
    }

    const { message, httpStatusCode } = result.error!;
    return res.status(httpStatusCode ? httpStatusCode : 500).json(message);
  },
};
