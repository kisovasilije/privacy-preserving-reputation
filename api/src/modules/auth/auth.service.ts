import { result, Result } from '../../common/result';
import { authHelpers } from '../../common/utils/jwt.helper';
import { User } from '../../generated/prisma/client';
import { authRepository } from './auth.repository';
import { AuthenticationRequest, RegistrationRequest } from './auth.schemas';
import bcrypt from 'bcryptjs';

export const authService = {
  authenticate: async (authenticationRequest: AuthenticationRequest): Promise<Result> => {
    const user = await authRepository.getByUsername(authenticationRequest.username);
    if (!user) {
      return result.failure({ message: 'User not found', httpStatusCode: 404 });
    }

    const match = await authHelpers.comparePasswords(authenticationRequest.password, user.password);
    if (!match) {
      return result.failure({
        message: 'Invalid username or password',
        httpStatusCode: 400,
      });
    }

    return result.success({ username: user.username, accessToken: authHelpers.signAccessToken(user) });
  },

  register: async (registrationRequest: RegistrationRequest): Promise<Result> => {
    const { email, username, password } = registrationRequest;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await authRepository.register({ email, username, password: passwordHash });
    return result.success({ username: user.username, email: user.email });
  },

  refresh: async (id: number, username: string, email: string): Promise<Result> => {
    const exists = await authRepository.existsByUsername(username);
    if (!exists) {
      return result.failure({ message: 'User not found', httpStatusCode: 404 });
    }

    return result.success({ accessToken: authHelpers.signAccessToken({ id, username, email }) });
  },

  getById: async (id: number): Promise<User | null> => {
    return await authRepository.getById(id);
  },

  getAll: async (): Promise<User[]> => {
    return await authRepository.getAll();
  },
};
