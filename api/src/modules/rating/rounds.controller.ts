import { Request, Response } from 'express';
import { CreateRoundRequest } from './rounds.schemas';
import { roundsService } from './rounds.service';
import { badRequest, conflict, created, forbidden, notFound, ok } from '../../common/utils/response.http';
import { OpenedRounds } from './models/opened-rounds.model';
import { Round } from '../../generated/prisma/client';

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

  close: async (req: Request<{ roundId: string }>, res: Response<Round>) => {
    const roundId = Number(req.params.roundId);
    const userId = req.user!.id;

    const result = await roundsService.close(roundId, userId);
    if (result.success) {
      return ok(res, result.value!);
    }

    if (!isErrorWithCode(result.error)) {
      return badRequest(res, 'Failed to close round');
    }

    switch (result.error.errorCode) {
      case 'ROUND_NOT_FOUND':
        return notFound(res, result.error.message);
      case 'FORBIDDEN':
        return forbidden(res, result.error.message);
      case 'ROUND_ALREADY_CLOSED':
        return conflict(res, result.error.message);
    }
  },
};

function isErrorWithCode(error: unknown): error is { message: string; errorCode: string } {
  return error != null && typeof error === 'object' && 'errorCode' in error && 'message' in error;
}
