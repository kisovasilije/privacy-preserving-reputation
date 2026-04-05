import { Request, Response } from 'express';
import { RegistrationRequest } from './auth.schemas';
import { authService } from './auth.service';

export const authController = {
  authenticate: async (req: Request, res: Response) => {},

  register: async (_: Request, res: Response, body: RegistrationRequest) => {
    const { success, value } = await authService.register(body);
    if (success) {
      res.status(201).json(value);
      return;
    } else {
      res.status(400).json({ message: 'Registration failed', details: value });
      return;
    }
  },
};
