import {
  Component, computed, inject, signal, HostListener, ElementRef,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  styles: [`
    :host { display: block; }

    .nav-link {
      display: inline-flex;
      align-items: center;
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 150ms ease-out, background-color 150ms ease-out;
      min-height: 2.25rem;
    }
    .nav-link:hover { color: var(--text-primary); background: rgba(255,255,255,0.06); }
    .nav-link-active { color: var(--color-info-fg) !important; background: var(--color-info-bg) !important; }

    .mobile-nav-link {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 0.875rem;
      border-radius: var(--radius-md);
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 150ms ease-out, background-color 150ms ease-out;
      margin-bottom: 0.125rem;
      min-height: 2.75rem;
    }
    .mobile-nav-link:hover { color: var(--text-primary); background: rgba(255,255,255,0.06); }
    .mobile-nav-link-active { color: var(--color-info-fg) !important; background: var(--color-info-bg) !important; }

    @keyframes slide-in-left {
      from { transform: translateX(-100%); opacity: 0; }
      to   { transform: translateX(0);     opacity: 1; }
    }

    .drawer {
      animation: slide-in-left var(--duration-normal) var(--ease-out) both;
    }

    .avatar {
      width: 1.875rem; height: 1.875rem;
      border-radius: 9999px;
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 0.6875rem; font-weight: 700; color: #fff;
      flex-shrink: 0; user-select: none;
    }

    .avatar-lg {
      width: 2.375rem; height: 2.375rem;
      font-size: 0.875rem;
    }
  `],
  template: `
    @if (auth.isAuthenticated()) {

      <!-- ═══ GLASS TOP BAR ═══ -->
      <header
        class="glass"
        style="position:sticky;top:0;z-index:50;border-radius:0;border-left:none;border-right:none;border-top:none"
      >
        <nav
          style="max-width:76rem;margin:0 auto;display:flex;align-items:center;justify-content:space-between;
                 padding:0 1rem;height:3.75rem"
          aria-label="Main navigation"
        >

          <!-- Logo -->
          <a
            routerLink="/invoices"
            style="text-decoration:none;display:flex;align-items:center;gap:0.5rem;
                   font-weight:700;font-size:0.9375rem;letter-spacing:-0.02em;color:var(--text-primary)"
            aria-label="Invoice Tracker — go to invoices"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="18" height="18" rx="4" fill="#0ea5e9" opacity=".15"/>
              <rect x="2" y="2" width="18" height="18" rx="4" stroke="#0ea5e9" stroke-width="1.6"/>
              <path d="M6 8h10M6 12h7M6 16h4" stroke="#0ea5e9" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            <span class="hidden sm:inline">Invoice Tracker</span>
          </a>

          <!-- Desktop nav links (centre) -->
          <div class="hidden sm:flex items-center gap-1" role="list" aria-label="Primary links">
            <a routerLink="/invoices" routerLinkActive="nav-link-active" class="nav-link" role="listitem">
              Invoices
            </a>
            <a routerLink="/clients"  routerLinkActive="nav-link-active" class="nav-link" role="listitem">
              Clients
            </a>
          </div>

          <!-- Right controls -->
          <div style="display:flex;align-items:center;gap:0.25rem">

            <!-- Theme toggle -->
            <button
              class="btn btn-ghost btn-icon"
              (click)="themeService.toggle()"
              [attr.aria-label]="themeService.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
              type="button"
            >
              @if (themeService.theme() === 'dark') {
                <!-- Sun -->
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="9" cy="9" r="3.5" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              } @else {
                <!-- Moon -->
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M15.5 11A7.5 7.5 0 017 3.5a7.5 7.5 0 100 13.5A7.5 7.5 0 0015.5 11z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              }
            </button>

            <!-- User menu (desktop only) -->
            <div class="hidden sm:block" style="position:relative" #userMenuAnchor>
              <button
                class="btn btn-ghost"
                style="gap:0.5rem;padding:0.3125rem 0.5rem;min-height:2.5rem"
                (click)="toggleUserMenu($event)"
                [attr.aria-expanded]="userMenuOpen()"
                aria-haspopup="menu"
                aria-label="Open user menu"
                type="button"
              >
                <span class="avatar">{{ initials() }}</span>
                <span style="font-size:0.8125rem;color:var(--text-secondary);max-width:8rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                  {{ auth.user()?.name }}
                </span>
                <svg
                  width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"
                  [style.transform]="userMenuOpen() ? 'rotate(180deg)' : ''"
                  style="transition:transform 150ms ease-out;flex-shrink:0"
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              @if (userMenuOpen()) {
                <div
                  class="row-actions-menu"
                  style="min-width:13.5rem;right:0;left:auto;top:calc(100% + 6px)"
                  role="menu"
                  aria-label="User options"
                >
                  <!-- Header -->
                  <div style="padding:0.75rem 0.875rem;border-bottom:1px solid var(--border-base)">
                    <p style="margin:0;font-size:0.875rem;font-weight:600;color:var(--text-primary)">
                      {{ auth.user()?.name }}
                    </p>
                    <p style="margin:0.125rem 0 0.5rem;font-size:0.75rem;color:var(--text-muted)">
                      {{ auth.user()?.email }}
                    </p>
                    <span class="badge" [class]="auth.user()?.role === 'admin' ? 'badge-paid' : 'badge-draft'">
                      {{ auth.user()?.role }}
                    </span>
                  </div>
                  <!-- Logout -->
                  <button
                    class="row-actions-item danger"
                    (click)="logout()"
                    role="menuitem"
                    type="button"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M5 12H3a1 1 0 01-1-1V3a1 1 0 011-1h2M10 10l3-3-3-3M13 7H6"
                        stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Sign out
                  </button>
                </div>
              }
            </div>

            <!-- Mobile hamburger -->
            <button
              class="sm:hidden btn btn-ghost btn-icon"
              (click)="mobileOpen.set(!mobileOpen())"
              [attr.aria-expanded]="mobileOpen()"
              aria-controls="mobile-drawer"
              aria-label="Open navigation menu"
              type="button"
            >
              @if (mobileOpen()) {
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              } @else {
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              }
            </button>
          </div>
        </nav>
      </header>

      <!-- ═══ MOBILE DRAWER ═══ -->
      @if (mobileOpen()) {
        <!-- Backdrop -->
        <div
          style="position:fixed;inset:0;z-index:40;background:rgba(0,0,0,0.50);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)"
          (click)="mobileOpen.set(false)"
          aria-hidden="true"
        ></div>

        <!-- Drawer panel -->
        <div
          id="mobile-drawer"
          class="glass drawer"
          style="position:fixed;top:0;left:0;height:100dvh;width:min(17rem,82vw);z-index:41;
                 display:flex;flex-direction:column;
                 border-radius:0 var(--radius-xl) var(--radius-xl) 0;
                 border-left:none;border-top:none;border-bottom:none"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <!-- Drawer header -->
          <div style="display:flex;align-items:center;justify-content:space-between;
                      padding:1.125rem 1rem 1rem;border-bottom:1px solid var(--border-base)">
            <span style="font-weight:700;font-size:0.9375rem;color:var(--text-primary)">
              Invoice Tracker
            </span>
            <button
              class="btn btn-ghost btn-icon"
              (click)="mobileOpen.set(false)"
              aria-label="Close menu"
              type="button"
            >
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Drawer nav -->
          <nav style="padding:0.625rem;flex:1;overflow-y:auto" aria-label="Mobile navigation">
            <a
              routerLink="/invoices"
              routerLinkActive="mobile-nav-link-active"
              class="mobile-nav-link"
              (click)="mobileOpen.set(false)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="12" height="12" rx="2.5" stroke="currentColor" stroke-width="1.4"/>
                <path d="M5 6h6M5 9.5h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              Invoices
            </a>
            <a
              routerLink="/clients"
              routerLinkActive="mobile-nav-link-active"
              class="mobile-nav-link"
              (click)="mobileOpen.set(false)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" stroke-width="1.4"/>
                <path d="M2.5 13.5c0-2.8 2.5-4.5 5.5-4.5s5.5 1.7 5.5 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              Clients
            </a>
          </nav>

          <!-- Drawer footer: user info + actions -->
          <div style="padding:1rem;border-top:1px solid var(--border-base)">
            <!-- User row -->
            <div style="display:flex;align-items:center;gap:0.75rem;padding:0.625rem 0.25rem 0.875rem">
              <span class="avatar avatar-lg">{{ initials() }}</span>
              <div style="min-width:0">
                <p style="margin:0;font-size:0.875rem;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                  {{ auth.user()?.name }}
                </p>
                <p style="margin:0;font-size:0.75rem;color:var(--text-muted)">{{ auth.user()?.role }}</p>
              </div>
            </div>

            <!-- Theme toggle -->
            <button
              class="btn btn-secondary"
              style="width:100%;justify-content:flex-start;gap:0.625rem;margin-bottom:0.5rem"
              (click)="themeService.toggle()"
              type="button"
            >
              @if (themeService.theme() === 'dark') {
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="9" cy="9" r="3.5" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Light mode
              } @else {
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M15.5 11A7.5 7.5 0 017 3.5a7.5 7.5 0 100 13.5A7.5 7.5 0 0015.5 11z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Dark mode
              }
            </button>

            <!-- Sign out -->
            <button
              class="btn btn-danger"
              style="width:100%;justify-content:flex-start;gap:0.625rem"
              (click)="logout()"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 12H3a1 1 0 01-1-1V3a1 1 0 011-1h2M10 10l3-3-3-3M13 7H6"
                  stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Sign out
            </button>
          </div>
        </div>
      }
    }
  `,
})
export class NavbarComponent {
  readonly auth         = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private  readonly router = inject(Router);
  private  readonly host   = inject(ElementRef);

  readonly userMenuOpen = signal(false);
  readonly mobileOpen   = signal(false);

  readonly initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  });

  /** Close user menu when clicking outside the navbar host element. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target)) {
      this.userMenuOpen.set(false);
    }
  }

  /** Escape closes both menus. */
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
