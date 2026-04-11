import bcrypt from 'bcryptjs';
import { User } from '../../generated/prisma/client';
import { JsonWebTokenError, sign, SignOptions, verify } from 'jsonwebtoken';
import { environment } from '../../config/env';
import { JwtUser } from '../models/jwt-user.model';

export const authHelpers = {
  comparePasswords: (password: string, passwordHash: string): Promise<boolean> => {
    return bcrypt.compare(password, passwordHash);
  },

  signAccessToken: (user: { id: number; username: string; email: string }): string => {
    const options: SignOptions = {
      algorithm: 'HS256',
      expiresIn: environment.JWT_EXPIRATION,
      issuer: environment.JWT_ISSUER,
      audience: environment.JWT_AUDIENCE,
      subject: user.username,
    };

    return sign({ id: user.id, email: user.email }, environment.JWT_SECRET, options);
  },

  verifyAccessToken: (token: string): JwtUser => {
    const decoded = verify(token, environment.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: environment.JWT_ISSUER,
      audience: environment.JWT_AUDIENCE,
    });

    if (
      decoded == null ||
      typeof decoded !== 'object' ||
      typeof decoded.id !== 'number' ||
      typeof decoded.sub !== 'string' ||
      typeof decoded.email !== 'string'
    ) {
      throw new JsonWebTokenError('Invalid token payload');
    }

    return { id: decoded.id, username: decoded.sub, email: decoded.email };
  },
};
