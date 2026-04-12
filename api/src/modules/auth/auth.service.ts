import { result, Result } from '../../common/result';
import { Error } from '../../common/result/result-error.model';
import { authHelpers } from '../../common/utils/jwt.helper';
import { authRepository } from './auth.repository';
import { AuthenticationRequest, RegistrationRequest } from './auth.schemas';
import bcrypt from 'bcryptjs';

export const authService = {
  authenticate: async (authenticationRequest: AuthenticationRequest): Promise<Result> => {
    const user = await authRepository.getByUsername(authenticationRequest.username);
    if (!user) {
      return result.failure(new Error('User not found'));
    }

    const match = await authHelpers.comparePasswords(authenticationRequest.password, user.password);
    if (!match) {
      return result.failure(new Error('Invalid username or password'));
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
      return result.failure(new Error('User not found'));
    }

    return result.success({ accessToken: authHelpers.signAccessToken({ id, username, email }) });
  },
};
