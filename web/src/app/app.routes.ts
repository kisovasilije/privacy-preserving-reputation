import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';
import { AuthPageComponent } from './features/auth/auth-page.component';
import { HomePageComponent } from './features/home/home-page.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'auth',
    component: AuthPageComponent,
    canActivate: [guestGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
