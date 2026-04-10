import { Request, Response } from 'express';
import { AuthenticationRequest, RegistrationRequest } from './auth.schemas';
import { authService } from './auth.service';
import { badRequest, created, ok } from '../../common/utils/response.http';

export const authController = {
  authenticate: async (_: Request, res: Response, body: AuthenticationRequest): Promise<Response | void> => {
    const { success, value } = await authService.authenticate(body);
    if (!success) {
      return badRequest(res, 'Authentication failed');
    }

    return ok(res, value);
  },

  register: async (_: Request, res: Response, body: RegistrationRequest): Promise<Response | void> => {
    const { success, value } = await authService.register(body);
    if (!success) {
      return badRequest(res, 'Registration failed');
    }

    return created(res, value);
  },

  refresh: async (req: Request, res: Response): Promise<Response | void> => {
    const { sub, email } = req.user!;
    const result = await authService.refresh(sub, email);
    if (!result.success) {
      return badRequest(res, 'Token refresh failed');
    }

    return ok(res, result.value);
  },
};
