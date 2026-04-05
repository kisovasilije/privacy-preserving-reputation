import { authRepository } from './auth.repository';
import { RegistrationRequest } from './auth.schemas';
import bcrypt from 'bcryptjs';

export const authService = {
  register: async (registrationRequest: RegistrationRequest): Promise<{ success: boolean; value: unknown }> => {
    const { email, username, password } = registrationRequest;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await authRepository.register({ email, username, password: passwordHash });
    return { success: true, value: user };
  },
};
