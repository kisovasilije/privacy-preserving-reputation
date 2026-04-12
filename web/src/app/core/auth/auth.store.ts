import { Injectable, computed, signal } from '@angular/core';

interface AuthSession {
  accessToken: string;
  userId: number | null;
  username: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly storageKey = 'ppr.accessToken';
  private readonly sessionState = signal<AuthSession | null>(this.readInitialSession());

  readonly accessToken = computed(() => this.sessionState()?.accessToken ?? null);
  readonly userId = computed(() => this.sessionState()?.userId ?? null);
  readonly username = computed(() => this.sessionState()?.username ?? null);
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  setSession(accessToken: string, username?: string | null): void {
    const claims = this.decodeSessionClaims(accessToken);
    this.sessionState.set({
      accessToken,
      userId: claims.userId,
      username: username ?? claims.username,
    });
    localStorage.setItem(this.storageKey, accessToken);
  }

  clear(): void {
    this.sessionState.set(null);
    localStorage.removeItem(this.storageKey);
  }

  private readInitialSession(): AuthSession | null {
    const accessToken = localStorage.getItem(this.storageKey);
    if (!accessToken) {
      return null;
    }

    const claims = this.decodeSessionClaims(accessToken);

    return {
      accessToken,
      userId: claims.userId,
      username: claims.username,
    };
  }

  private decodeSessionClaims(token: string): { userId: number | null; username: string | null } {
    try {
      const [, payloadSegment] = token.split('.');
      if (!payloadSegment) {
        return { userId: null, username: null };
      }

      const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const payload = JSON.parse(atob(padded)) as { id?: number; sub?: string };
      return {
        userId: typeof payload.id === 'number' ? payload.id : null,
        username: typeof payload.sub === 'string' ? payload.sub : null,
      };
    } catch {
      return { userId: null, username: null };
    }
  }
}
