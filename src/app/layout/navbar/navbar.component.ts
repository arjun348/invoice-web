import { Component, computed, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styles: [`
    :host { display: block; }
    .nav-link {
      display: inline-flex; align-items: center; padding: 0.375rem 0.75rem;
      border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 500;
      color: var(--text-secondary); text-decoration: none; transition: all 150ms ease-out;
      min-height: 2.25rem;
    }
    .nav-link:hover { color: var(--text-primary); background: rgba(255,255,255,0.06); }
    .nav-link-active { color: var(--color-info-fg) !important; background: var(--color-info-bg) !important; }
    .mobile-nav-link {
      display: flex; align-items: center; gap: 0.625rem; padding: 0.75rem 0.875rem;
      border-radius: var(--radius-md); font-size: 0.9375rem; font-weight: 500;
      color: var(--text-secondary); text-decoration: none; margin-bottom: 0.125rem; min-height: 2.75rem;
    }
    .mobile-nav-link:hover { color: var(--text-primary); background: rgba(255,255,255,0.06); }
    .mobile-nav-link-active { color: var(--color-info-fg) !important; background: var(--color-info-bg) !important; }
    .avatar {
      width: 1.875rem; height: 1.875rem; border-radius: 9999px;
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 0.6875rem; font-weight: 700; color: #fff; flex-shrink: 0; user-select: none;
    }
    .avatar-lg { width: 2.375rem; height: 2.375rem; font-size: 0.875rem; }
  `],
  template: `
    @if (auth.isAuthenticated()) {
      <!-- GLASS TOP BAR -->
      <header class="glass" style="position:sticky; top:0; z-index:50; border-radius:0; border-left:none; border-right:none; border-top:none">
        <nav style="max-width:76rem; margin:0 auto; display:flex; align-items:center; justify-content:space-between; padding:0 1rem; height:3.75rem">
          
          <!-- Logo -->
          <a [routerLink]="homeRoute()" style="text-decoration:none; display:flex; align-items:center; gap:0.5rem; font-weight:700; font-size:0.9375rem; color:var(--text-primary)">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect width="22" height="22" rx="4" fill="#0ea5e9" opacity=".15"/><rect width="22" height="22" rx="4" stroke="#0ea5e9" stroke-width="1.6"/><path d="M6 8h10M6 12h7M6 16h4" stroke="#0ea5e9" stroke-width="1.6" stroke-linecap="round"/></svg>
            <span class="hidden sm:inline">Invoice Tracker</span>
          </a>

          <!-- Desktop Links -->
          <div class="hidden sm:flex items-center gap-1">
            <a *ngFor="let item of menuItems()" [routerLink]="item.path" routerLinkActive="nav-link-active" class="nav-link">
              {{ item.label }}
            </a>
          </div>

          <!-- Controls Right -->
          <div style="display:flex; align-items:center; gap:0.25rem">
            <button class="btn btn-ghost btn-icon" (click)="themeService.toggle()" [attr.aria-label]="themeService.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" type="button">
              @if (themeService.theme() === 'dark') {
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="9" cy="9" r="3.5" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              } @else {
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M15.5 11A7.5 7.5 0 017 3.5a7.5 7.5 0 100 13.5A7.5 7.5 0 0015.5 11z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              }
            </button>

            <!-- User Dropdown Menu -->
            <div class="hidden sm:block" style="position:relative">
              <button class="btn btn-ghost" style="gap:0.5rem; padding:0.3125rem 0.5rem; min-height:2.5rem" (click)="toggleUserMenu($event)" type="button">
                <span class="avatar">{{ initials() }}</span>
                <span style="font-size:0.8125rem; color:var(--text-secondary)">{{ auth.user()?.name }}</span>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" [style.transform]="userMenuOpen() ? 'rotate(180deg)' : ''" style="transition:transform 150ms ease-out; flex-shrink:0"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>

              @if (userMenuOpen()) {
                <div class="row-actions-menu" style="min-width:13.5rem; right:0; left:auto; top:calc(100% + 6px); padding:0.75rem; border-radius:var(--radius-md); background:var(--bg-surface-1); border:1px solid var(--border-base)">
                  <p style="margin:0; font-size:0.875rem; font-weight:600; color:var(--text-primary)">{{ auth.user()?.name }}</p>
                  <p style="margin:0.125rem 0 0.5rem; font-size:0.75rem; color:var(--text-muted)">{{ auth.user()?.email }}</p>
                  <button class="row-actions-item danger w-full text-left font-medium" (click)="logout()" type="button">Sign out</button>
                </div>
              }
            </div>

            <!-- Mobile Hamburger Toggle -->
            <button class="sm:hidden btn btn-ghost btn-icon" (click)="mobileOpen.set(!mobileOpen())" type="button">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h14M3 10h14M3 14h14"/></svg>
            </button>
          </div>
        </nav>
      </header>

      <!-- MOBILE NAV DRAWER -->
      @if (mobileOpen()) {
        <div style="position:fixed; inset:0; z-index:40; background:rgba(0,0,0,0.5); backdrop-filter:blur(2px)" (click)="mobileOpen.set(false)"></div>
        <div class="glass" style="position:fixed; top:0; left:0; height:100dvh; width:15rem; z-index:41; display:flex; flex-direction:column; border-radius:0 var(--radius-xl) var(--radius-xl) 0; padding:1rem; border-left:none">
          <div style="font-weight:700; padding-bottom:1rem; border-bottom:1px solid var(--border-base)">Invoice Tracker</div>
          <nav style="padding:1rem 0; flex:1" class="flex flex-col gap-1">
            <a *ngFor="let item of menuItems()" [routerLink]="item.path" routerLinkActive="mobile-nav-link-active" class="mobile-nav-link" (click)="mobileOpen.set(false)">
              {{ item.label }}
            </a>
          </nav>
          <button class="btn btn-danger w-full text-left" (click)="logout()" type="button">Sign out</button>
        </div>
      }
    }
  `
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef);

  readonly userMenuOpen = signal(false);
  readonly mobileOpen = signal(false);

  readonly menuItems = computed(() => {
    const role = this.auth.user()?.role as string;
    if (role === 'super_admin') {
      return [{ label: 'Companies', path: '/super-admin/companies' }];
    }
    const items = [
      { label: 'Invoices', path: '/invoices' },
      { label: 'Clients', path: '/clients' }
    ];
    if (role === 'admin') {
      items.push({ label: 'Team', path: '/team' });
    }
    return items;
  });

  readonly homeRoute = computed(() => {
    return (this.auth.user()?.role as string) === 'super_admin' ? '/super-admin/companies' : '/invoices';
  });

  readonly initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target)) {
      this.userMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.userMenuOpen.set(false);
    this.mobileOpen.set(false);
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen.update(v => !v);
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.mobileOpen.set(false);
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
