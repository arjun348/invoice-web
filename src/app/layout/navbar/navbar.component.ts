import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if (auth.isAuthenticated()) {
      <header class="border-b border-slate-800 bg-slate-950 text-slate-100">
        <nav class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <a routerLink="/invoices" class="font-bold tracking-tight">Invoice Tracker</a>

          <div class="flex items-center gap-4 text-sm">
            <a routerLink="/invoices" routerLinkActive="text-sky-400" class="text-slate-300 hover:text-white">
              Invoices
            </a>
            <a routerLink="/clients" routerLinkActive="text-sky-400" class="text-slate-300 hover:text-white">
              Clients
            </a>
            <span class="hidden text-slate-500 sm:inline">
              {{ auth.user()?.name }} · {{ auth.user()?.role }}
            </span>
            <button class="text-slate-300 hover:text-white" (click)="logout()">Logout</button>
          </div>
        </nav>
      </header>
    }
  `,
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}