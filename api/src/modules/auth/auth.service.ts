import { JwtUser } from '../../common/models/jwt-user.model';
import { result, Result } from '../../common/result';
import { authHelpers } from '../../common/utils/jwt.helper';
import { authRepository } from './auth.repository';
import { AuthenticationRequest, RegistrationRequest } from './auth.schemas';
import bcrypt from 'bcryptjs';

export const authService = {
  authenticate: async (authenticationRequest: AuthenticationRequest): Promise<Result> => {
    const user = await authRepository.getByUsername(authenticationRequest.username);
    if (!user) {
      return result.failure('User not found');
    }

    const match = await authHelpers.comparePasswords(authenticationRequest.password, user.password);
    if (!match) {
      return result.failure('Invalid username or password');
    }

    return result.success({ username: user.username, accessToken: authHelpers.signAccessToken(user) });
  },

  register: async (registrationRequest: RegistrationRequest): Promise<Result> => {
    const { email, username, password } = registrationRequest;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await authRepository.register({ email, username, password: passwordHash });
    return result.success({ username: user.username, email: user.email });
  },

  refresh: async (username: string, email: string): Promise<Result> => {
    const exists = await authRepository.existsByUsername(username);
    if (!exists) {
      return result.failure('User not found');
    }

    return result.success({ accessToken: authHelpers.signAccessToken({ username, email }) });
  },
};
