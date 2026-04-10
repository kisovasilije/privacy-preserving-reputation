import { User } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { UserCreation } from './models/user-creation';

export const authRepository = {
  register: async (user: UserCreation): Promise<User> => {
    return prisma.user.create({ data: user });
  },

  getByUsername: async (username: string): Promise<User | null> => {
    return prisma.user.findUnique({ where: { username } });
  },
};
