import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from './core/auth/auth.service';
import { AuthStore } from './core/auth/auth.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatButtonModule, MatToolbarModule],
  templateUrl: './app.shell.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  protected readonly authStore = inject(AuthStore);

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/auth'], {
      queryParams: { mode: 'login' },
      replaceUrl: true,
    });
  }
}
