import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <main class="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <section class="mx-auto max-w-md rounded-2xl bg-slate-900 p-8 shadow-2xl ring-1 ring-white/10">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">
          Invoice Tracker
        </p>
        <h1 class="mt-3 text-3xl font-bold">Welcome back</h1>
        <p class="mt-2 text-sm text-slate-400">
          Sign in to manage clients and invoices.
        </p>

        @if (error()) {
          <div class="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {{ error() }}
          </div>
        }

        <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="submit()">
          <label class="block">
            <span class="text-sm font-medium">Email</span>
            <input
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none transition focus:border-sky-400"
              type="email"
              formControlName="email"
              autocomplete="email"
            />
          </label>

          <label class="block">
            <span class="text-sm font-medium">Password</span>
            <input
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none transition focus:border-sky-400"
              type="password"
              formControlName="password"
              autocomplete="current-password"
            />
          </label>

          <button
            class="w-full rounded-lg bg-sky-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            [disabled]="loading()"
          >
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="mt-6 text-xs text-slate-500">
          Admin: admin&#64;demo.test / Admin&#64;12345
        </p>
      </section>
    </main>
  `,
})
export class LoginComponent {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['admin@demo.test', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Enter a valid email address and password.');

      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/invoices'),
        error: (response: HttpErrorResponse) => {
          this.error.set(
            response.error?.message ?? 'Unable to sign in. Please try again.',
          );
        },
      });
  }
}