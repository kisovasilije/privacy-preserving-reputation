import { Router } from 'express';
import { validate, withBody } from '../../../common/utils/validator';
import { closeRoundParamsSchema, createRoundSchema } from '../rounds.schemas';
import { roundsController } from '../rounds.controller';
import { isAuthenticated } from '../../../common/middlewares/auth.middleware';

export const roundsRouter = Router();

roundsRouter.post('/', isAuthenticated, withBody(createRoundSchema, roundsController.create));

roundsRouter.get('/opened', isAuthenticated, roundsController.getOpened);

roundsRouter.patch(
  '/:roundId/close',
  isAuthenticated,
  validate(closeRoundParamsSchema, 'params'),
  roundsController.close,
);
