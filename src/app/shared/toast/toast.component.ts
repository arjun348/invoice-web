import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast/toast.service';

/** Toast icons keyed by type (inline SVG strings). */
const ICONS: Record<string, string> = {
  success: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  error:   `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 11h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  warning: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2L14.5 13.5H1.5L8 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 7v2.5M8 11.5h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  info:    `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 7.5v3M8 5.5h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
};

@Component({
  selector: 'app-toast',
  template: `
    <div
      class="toast-container"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div [class]="'toast toast-' + toast.type" role="alert">
          <span style="flex-shrink:0;display:flex;align-items:center" [innerHTML]="iconFor(toast.type)"></span>
          <span style="flex:1;line-height:1.45">{{ toast.message }}</span>
          <button
            style="flex-shrink:0;display:flex;align-items:center;justify-content:center;width:1.5rem;height:1.5rem;border-radius:var(--radius-sm);border:none;background:transparent;cursor:pointer;color:currentColor;opacity:.7;padding:0"
            (click)="toastService.remove(toast.id)"
            [attr.aria-label]="'Dismiss: ' + toast.message"
            type="button"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
  iconFor(type: string): string { return ICONS[type] ?? ''; }
}

