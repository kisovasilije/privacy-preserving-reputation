import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  if (authStore.isAuthenticated()) {
    return true;
  }

  return inject(Router).createUrlTree(['/auth'], {
    queryParams: { mode: 'login' },
  });
};

export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  if (!authStore.isAuthenticated()) {
    return true;
  }

  return inject(Router).createUrlTree(['/']);
};
