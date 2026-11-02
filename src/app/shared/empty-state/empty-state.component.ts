import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state">
      <!-- Document + plus icon -->
      <svg class="empty-state-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="10" y="6" width="38" height="48" rx="5" stroke="currentColor" stroke-width="2.5"/>
        <path d="M20 22h24M20 30h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="50" cy="50" r="10" fill="var(--bg-base)" stroke="currentColor" stroke-width="2.5"/>
        <path d="M47 50h6M50 47v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>

      <div style="text-align:center">
        <p style="margin:0 0 0.375rem;font-size:1rem;font-weight:600;color:var(--text-secondary)">{{ title }}</p>
        @if (description) {
          <p style="margin:0;font-size:0.875rem;color:var(--text-muted)">{{ description }}</p>
        }
      </div>

      @if (actionLabel) {
        <button class="btn btn-primary" (click)="action.emit()" type="button">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title       = 'Nothing here yet';
  @Input() description = '';
  @Input() actionLabel = '';

  @Output() action = new EventEmitter<void>();
}

