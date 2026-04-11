import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const body = error.error;

  if (typeof body?.message === 'string' && body.message.trim()) {
    return body.message;
  }

  if (Array.isArray(body?.errors) && typeof body.errors[0]?.message === 'string') {
    return body.errors[0].message;
  }

  return fallback;
}
