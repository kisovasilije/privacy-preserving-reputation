import { Injectable, computed, signal } from '@angular/core';

interface AuthSession {
  accessToken: string;
  username: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly storageKey = 'ppr.accessToken';
  private readonly sessionState = signal<AuthSession | null>(this.readInitialSession());

  readonly accessToken = computed(() => this.sessionState()?.accessToken ?? null);
  readonly username = computed(() => this.sessionState()?.username ?? null);
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  setSession(accessToken: string, username?: string | null): void {
    const resolvedUsername = username ?? this.decodeUsername(accessToken);
    this.sessionState.set({ accessToken, username: resolvedUsername });
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

    return {
      accessToken,
      username: this.decodeUsername(accessToken),
    };
  }

  private decodeUsername(token: string): string | null {
    try {
      const [, payloadSegment] = token.split('.');
      if (!payloadSegment) {
        return null;
      }

      const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const payload = JSON.parse(atob(padded)) as { sub?: string };
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
