import { Router } from 'express';
import { withBodyV2 } from '../../common/utils/validator';
import { authenticationSchema, registrationSchema } from './auth.schemas';
import { authController } from './auth.controller';
import { isAuthenticated } from '../../common/middlewares/auth.middleware';

export const authRouter = Router();

authRouter.post('/authenticate', withBodyV2(authenticationSchema, authController.authenticate));

authRouter.post('/register', withBodyV2(registrationSchema, authController.register));

authRouter.get('/refresh', isAuthenticated, authController.refresh);

authRouter.get('/users', isAuthenticated, authController.getAll);

// authRouter.post('/logout', async (req, res) => {});
