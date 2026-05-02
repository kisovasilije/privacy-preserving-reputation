import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, map, of, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import {
  AvailableUser,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
} from './auth.models';
import { AuthStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  login(request: LoginRequest) {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/authenticate`, request).pipe(
      tap(({ accessToken, username }) => this.authStore.setSession(accessToken, username)),
    );
  }

  register(request: RegisterRequest) {
    return this.http.post<RegisterResponse>(`${API_BASE_URL}/auth/register`, request);
  }

  refreshSession() {
    return this.http.get<RefreshResponse>(`${API_BASE_URL}/auth/refresh`).pipe(
      tap(({ accessToken }) => this.authStore.setSession(accessToken, this.authStore.username())),
      map(({ accessToken }) => accessToken),
    );
  }

  getUsers() {
    return this.http.get<AvailableUser[]>(`${API_BASE_URL}/auth/users`);
  }

  async initializeSession(): Promise<void> {
    if (!this.authStore.accessToken()) {
      return;
    }

    await firstValueFrom(
      this.refreshSession().pipe(
        map(() => void 0),
        catchError(() => {
          this.logout();
          return of(void 0);
        }),
      ),
    );
  }

  logout(): void {
    this.authStore.clear();
  }
}
