import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { ToastService } from '../../../core/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <main class="min-h-screen flex items-center justify-center p-4 relative page-enter">
      <!-- Top-right theme toggle -->
      <div class="absolute top-4 right-4">
        <button class="btn btn-ghost btn-icon" (click)="themeService.toggle()" type="button">
          @if (themeService.theme() === 'dark') {
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2" stroke="currentColor" stroke-width="1.5"/></svg>
          } @else {
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15.5 11A7.5 7.5 0 1 1 7 2.5" stroke="currentColor" stroke-width="1.5"/></svg>
          }
        </button>
      </div>

      <!-- Glass Login Card -->
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
          <div class="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300 flex items-start gap-2.5" role="alert">
            <span class="flex-1">{{ error() }}</span>
          </div>
        }

        <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div>
            <label class="field-label" for="login-email">Email address</label>
            <input id="login-email" class="input" type="email" formControlName="email" placeholder="name@company.com" />
          </div>

          <div>
            <label class="field-label" for="login-password">Password</label>
            <div class="relative">
              <input id="login-password" class="input pr-10" [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="••••••••" />
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400" (click)="showPassword.set(!showPassword())">
                📄
              </button>
            </div>
          </div>

          <button class="btn btn-primary w-full mt-2" type="submit" [disabled]="loading()">
            <span>Sign in</span>
          </button>
        </form>

        <div class="mt-4 text-center text-xs">
          <span class="text-[var(--text-muted)]">Need an account? </span>
          <button (click)="openRegisterModal()" type="button" class="text-sky-400 hover:text-sky-300 underline font-medium transition cursor-pointer bg-transparent border-0 p-0">
            Register your company
          </button>
        </div>

        <div class="mt-6 pt-5 border-t border-[var(--border-base)] text-xs text-[var(--text-muted)]">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-[var(--text-secondary)]">Demo Credentials:</span>
            <button type="button" class="text-sky-400 hover:text-sky-300 underline" (click)="fillDemoCredentials()">Fill Demo Login</button>
          </div>
        </div>
      </section>

      <!-- REGISTRATION OVERLAY MODAL -->
      <div *ngIf="showRegisterModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <section class="w-full max-w-md modal-panel surface p-8 border border-[var(--border-base)] shadow-2xl relative rounded-xl" style="backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
          
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Register New Company</h2>
            <button (click)="closeRegisterModal()" class="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-2xl font-bold bg-transparent border-0 cursor-pointer p-0 select-none">&times;</button>
          </div>

          <div *ngIf="regError()" class="mb-4 p-3.5 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
            {{ regError() }}
          </div>

          <div *ngIf="!isPendingApproval()">
            <form [formGroup]="registerForm" (ngSubmit)="submitRegistration()" class="space-y-4" novalidate>
              <div>
                <label class="field-label">Company Name</label>
                <input type="text" formControlName="company_name" class="input" placeholder="Apex Innovations" />
              </div>
              <div>
                <label class="field-label">Admin Full Name</label>
                <input type="text" formControlName="name" class="input" placeholder="Sarah Connor" />
              </div>
              <div>
                <label class="field-label">Email Address</label>
                <input type="email" formControlName="email" class="input" placeholder="sarah&#64;apex.test" />
              </div>
              <div>
                <label class="field-label">Password</label>
                <input type="password" formControlName="password" class="input" placeholder="••••••••" />
              </div>
              <div>
                <label class="field-label">Confirm Password</label>
                <input type="password" formControlName="password_confirmation" class="input" placeholder="••••••••" />
              </div>

              <button type="submit" class="btn btn-primary w-full mt-4" [disabled]="regLoading()">
                <span *ngIf="!regLoading()">Submit Registration</span>
                <span *ngIf="regLoading()" class="spinner"></span>
              </button>
            </form>
          </div>

          <div *ngIf="isPendingApproval()" class="text-center py-6 space-y-4">
            <h3 class="text-lg font-bold text-yellow-400">Awaiting Approval</h3>
            <p class="text-sm text-[var(--text-secondary)]">Your registration request was sent successfully. Access will be unlocked as soon as a platform super admin approves your company request.</p>
            <button (click)="closeRegisterModal()" class="btn btn-secondary w-full mt-2" type="button">Close Gateway</button>
          </div>
        </section>
      </div>
    </main>
  `,
})
export class LoginComponent {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly showRegisterModal = signal(false);
  readonly regLoading = signal(false);
  readonly regError = signal<string | null>(null);
  readonly isPendingApproval = signal(false);

  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);
  private readonly toast = inject(ToastService);

  @ViewChild('emailInput') emailInput?: ElementRef;

  readonly form = this.formBuilder.nonNullable.group({
    email: ['admin@demo.test', [Validators.required, Validators.email]],
    password: ['Admin@12345', [Validators.required]],
  });

  readonly registerForm = this.formBuilder.nonNullable.group({
    company_name: ['', [Validators.required]],
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]]
  });

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.routeRedirectByRole();
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
          this.routeRedirectByRole();
        },
        error: (response: HttpErrorResponse) => {
          if (response.status === 403 && response.error?.code) {
            this.error.set(response.error.message || 'Access restricted.');
          } else {
            this.error.set(response.error?.message ?? 'Invalid credentials.');
          }
        },
      });
  }

  openRegisterModal(): void {
    this.registerForm.reset();
    this.regError.set(null);
    this.isPendingApproval.set(false);
    this.showRegisterModal.set(true);
  }
  closeRegisterModal(): void {
    this.showRegisterModal.set(false);
  }
  submitRegistration(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.regError.set('Please fill out all registration fields correctly.');
      return;
    }
    const p = this.registerForm.getRawValue();
    if (p.password !== p.password_confirmation) {
      this.regError.set('Password confirmation mismatch.');
      return;
    }
    this.regLoading.set(true);
    this.regError.set(null);
    this.auth.registerCompany(p)
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
        }
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