import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { ToastService } from '../../../core/toast/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <main class="min-h-screen flex items-center justify-center p-4 relative page-enter">
      <!-- Top-right theme toggle -->
      <div class="absolute top-4 right-4">
        <button
          class="btn btn-ghost btn-icon"
          (click)="themeService.toggle()"
          [attr.aria-label]="themeService.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          type="button"
        >
          @if (themeService.theme() === 'dark') {
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="3.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          } @else {
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M15.5 11A7.5 7.5 0 017 3.5a7.5 7.5 0 100 13.5A7.5 7.5 0 0015.5 11z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          }
        </button>
      </div>

      <!-- Glass Login Card -->
      <section
        class="w-full max-w-md modal-panel surface p-8 sm:p-10 relative overflow-hidden"
        style="backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);"
      >
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <span class="text-xs font-semibold tracking-wider uppercase text-sky-500">Invoice Tracker</span>
        </div>

        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Welcome back
        </h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Sign in to manage your clients and invoices.
        </p>

        @if (error()) {
          <div
            class="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300 flex items-start gap-2.5"
            role="alert"
          >
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/>
            </svg>
            <span class="flex-1">{{ error() }}</span>
          </div>
        }

        <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div>
            <label class="field-label" for="login-email">Email address</label>
            <input
              #emailInput
              id="login-email"
              class="input"
              [class.error]="form.controls.email.touched && form.controls.email.invalid"
              type="email"
              formControlName="email"
              autocomplete="email"
              placeholder="name@company.com"
              [attr.aria-invalid]="form.controls.email.touched && form.controls.email.invalid"
              aria-describedby="email-error"
            />
            @if (form.controls.email.touched && form.controls.email.hasError('required')) {
              <p id="email-error" class="field-error" role="alert">Email is required.</p>
            } @else if (form.controls.email.touched && form.controls.email.hasError('email')) {
              <p id="email-error" class="field-error" role="alert">Please enter a valid email address.</p>
            }
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="field-label mb-0" for="login-password">Password</label>
            </div>
            <div class="relative">
              <input
                id="login-password"
                class="input pr-10"
                [class.error]="form.controls.password.touched && form.controls.password.invalid"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="current-password"
                placeholder="••••••••"
                [attr.aria-invalid]="form.controls.password.touched && form.controls.password.invalid"
                aria-describedby="password-error"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 transition"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
              >
                @if (showPassword()) {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                }
              </button>
            </div>
            @if (form.controls.password.touched && form.controls.password.hasError('required')) {
              <p id="password-error" class="field-error" role="alert">Password is required.</p>
            }
          </div>

          <button
            class="btn btn-primary w-full mt-2"
            type="submit"
            [disabled]="loading()"
          >
            @if (loading()) {
              <span class="spinner"></span>
              <span>Signing in…</span>
            } @else {
              <span>Sign in</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            }
          </button>
        </form>

        <!-- Demo credentials helper -->
        <div class="mt-6 pt-5 border-t border-[var(--border-base)] text-xs text-[var(--text-muted)]">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-[var(--text-secondary)]">Demo Credentials:</span>
            <button
              type="button"
              class="text-sky-400 hover:text-sky-300 underline transition cursor-pointer"
              (click)="fillDemoCredentials()"
            >
              Fill Demo Login
            </button>
          </div>
          <div class="font-mono bg-[var(--bg-surface-2)] p-2.5 rounded-lg border border-[var(--border-base)] space-y-1">
            <div class="flex justify-between">
              <span>Admin:</span>
              <span class="text-[var(--text-primary)]">admin&#64;demo.test</span>
            </div>
            <div class="flex justify-between">
              <span>Password:</span>
              <span class="text-[var(--text-primary)]">Admin&#64;12345</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  `,
})
export class LoginComponent {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);
  private readonly toast = inject(ToastService);

  @ViewChild('emailInput') emailInput?: ElementRef<HTMLInputElement>;

  readonly form = this.formBuilder.nonNullable.group({
    email: ['admin@demo.test', [Validators.required, Validators.email]],
    password: ['Admin@12345', [Validators.required]],
  });

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/invoices');
    }
  }

  fillDemoCredentials(): void {
    this.form.patchValue({
      email: 'admin@demo.test',
      password: 'Admin@12345',
    });
    this.toast.info('Demo credentials loaded');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please provide a valid email and password.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Signed in successfully');
          this.router.navigateByUrl('/invoices');
        },
        error: (response: HttpErrorResponse) => {
          this.error.set(
            response.error?.message ?? 'Invalid credentials. Please verify your email and password.',
          );
        },
      });
  }
}
