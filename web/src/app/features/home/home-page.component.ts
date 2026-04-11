import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { getApiErrorMessage } from '../../core/http/api-error.util';

@Component({
  selector: 'app-home-page',
  imports: [MatButtonModule, MatCardModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  protected readonly authStore = inject(AuthStore);

  private readonly authService = inject(AuthService);

  protected readonly refreshing = signal(false);
  protected readonly statusMessage = signal<string | null>(null);
  protected readonly statusTone = signal<'success' | 'error' | null>(null);

  protected renewAccessToken(): void {
    this.refreshing.set(true);
    this.statusMessage.set(null);
    this.statusTone.set(null);

    this.authService.refreshSession().subscribe({
      next: () => {
        this.refreshing.set(false);
        this.statusTone.set('success');
        this.statusMessage.set('Your private rating space is ready to use.');
      },
      error: (error: unknown) => {
        this.refreshing.set(false);
        this.statusTone.set('error');
        this.statusMessage.set(getApiErrorMessage(error, 'We could not reopen your private rating space right now.'));
      },
    });
  }
}
