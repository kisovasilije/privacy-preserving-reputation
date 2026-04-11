import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../core/auth/auth.service';
import { getApiErrorMessage } from '../../core/http/api-error.util';

const matchingPasswordsValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword || password === confirmPassword) {
    return null;
  }

  return { passwordMismatch: true };
};

@Component({
  selector: 'app-auth-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTabsModule,
  ],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss',
})
export class AuthPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly selectedTabIndex = toSignal(
    this.route.queryParamMap.pipe(map((params) => (params.get('mode') === 'register' ? 1 : 0))),
    {
      initialValue: this.route.snapshot.queryParamMap.get('mode') === 'register' ? 1 : 0,
    },
  );

  protected readonly loginPending = signal(false);
  protected readonly registerPending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(32)]],
    password: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(128)]],
  });

  protected readonly registerForm = this.formBuilder.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(32)]],
      password: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(128)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(128)]],
    },
    { validators: [matchingPasswordsValidator] },
  );

  protected onTabChange(index: number): void {
    this.clearMessages();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: index === 1 ? 'register' : 'login' },
      replaceUrl: true,
    });
  }

  protected submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.clearMessages();
    this.loginPending.set(true);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.loginPending.set(false);
        void this.router.navigate(['/'], { replaceUrl: true });
      },
      error: (error: unknown) => {
        this.loginPending.set(false);
        this.errorMessage.set(getApiErrorMessage(error, 'We could not open your private rating account.'));
      },
    });
  }

  protected submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.clearMessages();
    this.registerPending.set(true);

    this.authService.register(this.registerForm.getRawValue()).subscribe({
      next: ({ username }) => {
        this.registerPending.set(false);
        this.registerForm.reset({
          email: '',
          username: '',
          password: '',
          confirmPassword: '',
        });
        this.loginForm.patchValue({ username, password: '' });
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { mode: 'login' },
          replaceUrl: true,
        });
        this.successMessage.set('Your account is ready. Sign in and begin rating other users with privacy in place.');
      },
      error: (error: unknown) => {
        this.registerPending.set(false);
        this.errorMessage.set(getApiErrorMessage(error, 'We could not create your private rating account.'));
      },
    });
  }

  protected hasRegisterMismatch(): boolean {
    return this.registerForm.hasError('passwordMismatch') && this.registerForm.touched;
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
