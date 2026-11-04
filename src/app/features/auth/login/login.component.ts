import { A11yModule } from '@angular/cdk/a11y';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { ToastService } from '../../../core/toast/toast.service';
import { environment } from '../../../../environments/environment';

const passwordsMatch: ValidatorFn = (group) =>
  group.get('password')?.value === group.get('password_confirmation')?.value ? null : { mismatch: true };

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, A11yModule],
  styles: [`
    .register-modal-scroll { scrollbar-width: none; -ms-overflow-style: none; }
    .register-modal-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
  `],
  template: `
    <main class="min-h-screen flex items-center justify-center p-4 relative page-enter">
      <!-- Top-right theme toggle -->
      <div class="absolute top-4 right-4">
        <button class="btn btn-ghost btn-icon" (click)="themeService.toggle()" type="button" aria-label="Toggle theme">
          @if (themeService.theme() === 'dark') {
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2" stroke="currentColor" stroke-width="1.5"/></svg>
          } @else {
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15.5 11A7.5 7.5 0 1 1 7 2.5" stroke="currentColor" stroke-width="1.5"/></svg>
          }
        </button>
      </div>

      <!-- Glass login card -->
      <section class="w-full max-w-md modal-panel surface p-8 sm:p-10 relative overflow-hidden" style="backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
          </div>
          <span class="text-xs font-semibold tracking-wider uppercase text-sky-500">Invoice Tracker</span>
        </div>

        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">Welcome back</h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">Sign in to manage your clients and invoices.</p>

        @if (error()) {
          <div class="mt-6 rounded-lg border p-3.5 text-sm flex items-start gap-2.5"
               [class]="errorTone() === 'info'
                 ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                 : 'border-red-500/30 bg-red-500/10 text-red-300'"
               role="alert">
            <span class="flex-1">{{ error() }}</span>
          </div>
        }

        <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div>
            <label class="field-label" for="login-email">Email address</label>
            <input id="login-email" class="input" type="email" formControlName="email"
                   autocomplete="email" placeholder="name@company.com"
                   [attr.aria-invalid]="!!fieldError(form.controls.email, 'Email')" />
            @if (fieldError(form.controls.email, 'Email'); as msg) {
              <p class="mt-1 text-xs text-red-400">{{ msg }}</p>
            }
          </div>

          <div>
            <label class="field-label" for="login-password">Password</label>
            <div class="relative">
              <input id="login-password" class="input pr-10" formControlName="password"
                     [type]="showPassword() ? 'text' : 'password'"
                     autocomplete="current-password" placeholder="••••••••"
                     [attr.aria-invalid]="!!fieldError(form.controls.password, 'Password')" />
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-sky-500 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500"
                style="background: transparent; border: 0; cursor: pointer;"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                [attr.aria-pressed]="showPassword()">
                @if (showPassword()) {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                } @else {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            @if (fieldError(form.controls.password, 'Password'); as msg) {
              <p class="mt-1 text-xs text-red-400">{{ msg }}</p>
            }
          </div>

          <button class="btn btn-primary w-full mt-2" type="submit" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> } @else { <span>Sign in</span> }
          </button>
        </form>

        <div class="mt-4 text-center text-xs">
          <span class="text-[var(--text-muted)]">Need an account? </span>
          <button (click)="openRegisterModal()" type="button" class="text-sky-400 hover:text-sky-300 underline font-medium transition cursor-pointer bg-transparent border-0 p-0">
            Register your company
          </button>
        </div>

        <div class="mt-6 pt-5 border-t border-[var(--border-base)] text-xs text-[var(--text-muted)]">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span class="font-medium text-[var(--text-secondary)]">Demo credentials:</span>
            <button type="button" class="text-sky-400 hover:text-sky-300 underline" (click)="fillDemoCredentials()">Fill demo admin login</button>
            <button type="button" class="text-sky-400 hover:text-sky-300 underline" (click)="fillViewerCredentials()">Fill demo viewer login</button>
            @if (devLogins) {
              <button type="button" class="text-sky-400 hover:text-sky-300 underline" (click)="fillSuperAdminCredentials()">Fill super admin login (dev)</button>
            }
          </div>
        </div>
      </section>

      <!-- Registration modal -->
      @if (showRegisterModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(15,23,42,0.7); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
          (click)="closeRegisterModal()">
          <section class="register-modal-scroll w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-8 border border-[var(--border-base)] shadow-2xl"
            [style.background]="themeService.theme() === 'dark' ? '#0f172a' : '#ffffff'"
            [style.color]="themeService.theme() === 'dark' ? '#f1f5f9' : '#0f172a'"
                   role="dialog" aria-modal="true" aria-labelledby="register-title"
                   cdkTrapFocus cdkTrapFocusAutoCapture (click)="$event.stopPropagation()">
            <div class="flex justify-between items-center mb-6">
              <h2 id="register-title" class="text-2xl font-bold tracking-tight">Register New Company</h2>
              <button type="button" (click)="closeRegisterModal()" aria-label="Close"
                      class="p-1 rounded-md text-slate-500 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-sky-500">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </button>
            </div>

            @if (regError()) {
              <div class="mb-4 p-3.5 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-600" role="alert">{{ regError() }}</div>
            }

            @if (!isPendingApproval()) {
              <form [formGroup]="registerForm" (ngSubmit)="submitRegistration()" class="space-y-4" novalidate>
                <div>
                  <label class="field-label" for="reg-company">Company name</label>
                  <input id="reg-company" class="input" type="text" formControlName="company_name"
                         autocomplete="organization" placeholder="Apex Innovations"
                         [attr.aria-invalid]="!!fieldError(registerForm.controls.company_name, 'Company name')" />
                  @if (fieldError(registerForm.controls.company_name, 'Company name'); as msg) {
                    <p class="mt-1 text-xs text-red-600">{{ msg }}</p>
                  }
                </div>

                <div>
                  <label class="field-label" for="reg-name">Admin full name</label>
                  <input id="reg-name" class="input" type="text" formControlName="name"
                         autocomplete="name" placeholder="Sarah Connor"
                         [attr.aria-invalid]="!!fieldError(registerForm.controls.name, 'Name')" />
                  @if (fieldError(registerForm.controls.name, 'Name'); as msg) {
                    <p class="mt-1 text-xs text-red-600">{{ msg }}</p>
                  }
                </div>

                <div>
                  <label class="field-label" for="reg-email">Email address</label>
                  <input id="reg-email" class="input" type="email" formControlName="email"
                         autocomplete="email" placeholder="sarah&#64;apex.test"
                         [attr.aria-invalid]="!!fieldError(registerForm.controls.email, 'Email')" />
                  @if (fieldError(registerForm.controls.email, 'Email'); as msg) {
                    <p class="mt-1 text-xs text-red-600">{{ msg }}</p>
                  }
                </div>

                <div>
                  <label class="field-label" for="reg-password">Password</label>
                  <div class="relative">
                    <input id="reg-password" class="input pr-10" formControlName="password"
                           [type]="showRegPassword() ? 'text' : 'password'" autocomplete="new-password"
                           [attr.aria-invalid]="!!fieldError(registerForm.controls.password, 'Password')" />
                    <button type="button"
                            class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 hover:text-sky-500 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                            style="background: transparent; border: 0;"
                            (click)="showRegPassword.set(!showRegPassword())"
                            [attr.aria-label]="showRegPassword() ? 'Hide password' : 'Show password'"
                            [attr.aria-pressed]="showRegPassword()">
                      @if (showRegPassword()) {
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      } @else {
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                  <p class="mt-1 text-xs text-slate-500">At least 8 characters.</p>
                  @if (fieldError(registerForm.controls.password, 'Password'); as msg) {
                    <p class="mt-1 text-xs text-red-600">{{ msg }}</p>
                  }
                </div>

                <div>
                  <label class="field-label" for="reg-confirm">Confirm password</label>
                  <div class="relative">
                    <input id="reg-confirm" class="input pr-10" [type]="showRegConfirmPassword() ? 'text' : 'password'"
                           formControlName="password_confirmation" autocomplete="new-password" />
                    <button type="button"
                            class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 hover:text-sky-500 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                            style="background: transparent; border: 0;"
                            (click)="showRegConfirmPassword.set(!showRegConfirmPassword())"
                            [attr.aria-label]="showRegConfirmPassword() ? 'Hide confirm password' : 'Show confirm password'"
                            [attr.aria-pressed]="showRegConfirmPassword()">
                      @if (showRegConfirmPassword()) {
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      } @else {
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                  @if (registerForm.hasError('mismatch') && registerForm.controls.password_confirmation.touched) {
                    <p class="mt-1 text-xs text-red-600">Passwords do not match.</p>
                  }
                </div>

                <button type="submit" class="btn btn-primary w-full mt-2" [disabled]="regLoading()">
                  @if (regLoading()) { <span class="spinner"></span> } @else { <span>Submit registration</span> }
                </button>
                <p class="text-xs text-center text-slate-500">New companies are reviewed by an administrator before access is granted.</p>
              </form>
            } @else {
              <div class="text-center py-6 space-y-4">
                <h3 class="text-lg font-bold text-amber-600">Awaiting approval</h3>
                <p class="text-sm text-slate-600">Your request was sent. You can sign in as soon as a super admin approves your company.</p>
                <button (click)="closeRegisterModal()" class="btn btn-secondary w-full" type="button">Close</button>
              </div>
            }
          </section>
        </div>
      }
    </main>
  `,
})
export class LoginComponent {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly errorTone = signal<'error' | 'info'>('error');
  readonly showPassword = signal(false);

  readonly showRegisterModal = signal(false);
  readonly showRegPassword = signal(false);
  readonly showRegConfirmPassword = signal(false);
  readonly regLoading = signal(false);
  readonly regError = signal<string | null>(null);
  readonly isPendingApproval = signal(false);

  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);
  private readonly toast = inject(ToastService);

  // Dev-only logins come from environment.development.ts; production builds leave this null.
  readonly devLogins = environment.devLogins;

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly registerForm = this.formBuilder.nonNullable.group(
    {
      company_name: ['', [Validators.required]],
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.routeRedirectByRole();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showRegisterModal()) this.closeRegisterModal();
  }

  fieldError(control: AbstractControl | null, label: string): string | null {
    if (!control || !control.touched || !control.errors) return null;
    if (control.errors['required']) return `${label} is required.`;
    if (control.errors['email']) return 'Enter a valid email address.';
    if (control.errors['minlength']) {
      return `${label} must be at least ${control.errors['minlength'].requiredLength} characters.`;
    }
    return null;
  }

  fillDemoCredentials(): void {
    this.form.patchValue({ email: 'admin@demo.test', password: 'Admin@12345' });
    this.toast.info('Demo credentials loaded');
  }

  fillViewerCredentials(): void {
    this.form.patchValue({ email: 'viewer@demo.test', password: 'Viewer@12345' });
    this.toast.info('Viewer credentials loaded');
  }

  fillSuperAdminCredentials(): void {
    if (!this.devLogins) return;
    this.form.patchValue(this.devLogins.superAdmin);
    this.toast.info('Super admin credentials loaded');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorTone.set('error');
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
          this.routeRedirectByRole();
        },
        error: (response: HttpErrorResponse) => {
          const code = response.error?.code as string | undefined;
          if (response.status === 403 && code) {
            this.errorTone.set(code === 'company_pending' ? 'info' : 'error');
            this.error.set(response.error?.message || 'Access restricted.');
          } else {
            this.errorTone.set('error');
            this.error.set(response.error?.message ?? 'Invalid credentials.');
          }
        },
      });
  }

  openRegisterModal(): void {
    this.registerForm.reset();
    this.regError.set(null);
    this.isPendingApproval.set(false);
    this.showRegPassword.set(false);
    this.showRegConfirmPassword.set(false);
    this.showRegisterModal.set(true);
  }

  closeRegisterModal(): void {
    this.showRegisterModal.set(false);
  }

  submitRegistration(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.regError.set('Please correct the highlighted fields.');
      return;
    }

    this.regLoading.set(true);
    this.regError.set(null);

    this.auth
      .registerCompany(this.registerForm.getRawValue())
      .pipe(finalize(() => this.regLoading.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Registration request sent');
          this.isPendingApproval.set(true);
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 422 && err.error?.errors) {
            this.regError.set(Object.values(err.error.errors).flat().join(' '));
          } else {
            this.regError.set(err.error?.message || 'Failed to send onboarding request.');
          }
        },
      });
  }

  private routeRedirectByRole(): void {
    const currentRole = this.auth.user()?.role as string;
    if (currentRole === 'super_admin') {
      this.router.navigateByUrl('/super-admin/companies');
    } else {
      this.router.navigateByUrl('/invoices');
    }
  }
}