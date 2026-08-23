import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { AuthStore } from './auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const accessToken = inject(AuthStore).accessToken();

  if (
    !accessToken ||
    !req.url.startsWith(`${API_BASE_URL}/`) ||
    req.headers.has('Authorization')
  ) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  );
};
