import { Router } from 'express';
import { withBody } from '../../common/utils/validator';
import { authenticationSchema, registrationSchema } from './auth.schemas';
import { authController } from './auth.controller';
import { isAuthenticated } from '../../common/middlewares/auth.middleware';

export const authRouter = Router();

authRouter.post('/authenticate', withBody(authenticationSchema, authController.authenticate));

authRouter.post('/register', withBody(registrationSchema, authController.register));

authRouter.get('/refresh', isAuthenticated, authController.refresh);

// authRouter.post('/logout', async (req, res) => {});
