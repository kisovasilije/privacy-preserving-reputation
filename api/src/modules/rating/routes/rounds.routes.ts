import { Router } from 'express';
import { withBody } from '../../../common/utils/validator';
import { createRoundSchema } from '../rounds.schemas';
import { roundsController } from '../rounds.controller';
import { isAuthenticated } from '../../../common/middlewares/auth.middleware';

export const roundsRouter = Router();

roundsRouter.post('/', isAuthenticated, withBody(createRoundSchema, roundsController.create));

roundsRouter.get('/opened', async (req, res) => {});
