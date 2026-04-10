import bcrypt from 'bcryptjs';
import { User } from '../../generated/prisma/client';
import { sign, SignOptions } from 'jsonwebtoken';
import { environment } from '../../config/env';

export const authHelpers = {
  comparePasswords: (password: string, passwordHash: string): Promise<boolean> => {
    return bcrypt.compare(password, passwordHash);
  },

  signAccessToken: (user: User): string => {
    const options: SignOptions = {
      algorithm: 'HS256',
      expiresIn: environment.JWT_EXPIRATION,
      issuer: environment.JWT_ISSUER,
      audience: environment.JWT_AUDIENCE,
      subject: user.username,
    };

    return sign({ email: user.email }, environment.JWT_SECRET, options);
  },
};
