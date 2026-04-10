import { NextFunction, Request, Response } from 'express';
import { unauthorized } from '../utils/response.http';
import { authHelpers } from '../utils/jwt.helper';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return unauthorized(res, 'Authorization header is missing');
  }

  if (!authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'Invalid authorization header format');
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return unauthorized(res, 'Token is missing');
  }

  try {
    const decoded = authHelpers.verifyAccessToken(token);
    req.user = { sub: decoded.username, email: decoded.email };
    return next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return unauthorized(res, 'Token has expired');
    }

    if (error instanceof JsonWebTokenError) {
      return unauthorized(res, 'Invalid token');
    }

    return unauthorized(res, 'Authentication failed');
  }
}
