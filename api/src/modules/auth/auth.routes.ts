import { Router } from 'express';
import { withBody } from '../../common/validator';
import { authenticationSchema, registrationSchema } from './auth.schemas';
import { authController } from './auth.controller';

export const authRouter = Router();

authRouter.post('/authenticate', withBody(authenticationSchema, authController.authenticate));

authRouter.post('/register', withBody(registrationSchema, authController.register));

authRouter.post('/refresh', async (req, res) => {});

authRouter.post('/logout', async (req, res) => {});
