import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  imports: [FormsModule],
  template: `
    <div
      style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;
             gap:0.625rem;padding:0.875rem 1.25rem;font-size:0.8125rem;color:var(--text-secondary);
             border-top:1px solid var(--border-base)"
    >
      <!-- Range info -->
      <span aria-live="polite" aria-atomic="true">
        @if (total > 0) {
          {{ rangeStart }}–{{ rangeEnd }} of {{ total }}
        } @else {
          No results
        }
      </span>

      <div style="display:flex;align-items:center;gap:0.625rem;flex-wrap:wrap">
        <!-- Page size selector -->
        @if (pageSizeOptions.length > 1) {
          <label style="display:flex;align-items:center;gap:0.375rem;white-space:nowrap">
            <span>Rows</span>
            <select
              class="input"
              style="width:auto;min-height:2rem;height:2rem;padding:0 2rem 0 0.5rem;font-size:0.8125rem"
              [ngModel]="perPage"
              (ngModelChange)="pageSizeChange.emit(+$event)"
              aria-label="Rows per page"
            >
              @for (opt of pageSizeOptions; track opt) {
                <option [value]="opt">{{ opt }}</option>
              }
            </select>
          </label>
        }

        <!-- Page navigation -->
        <div style="display:flex;gap:0.3125rem" role="navigation" aria-label="Pagination">
          <button
            class="btn btn-secondary btn-sm"
            [disabled]="current <= 1"
            (click)="pageChange.emit(current - 1)"
            aria-label="Previous page"
            type="button"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M8.5 2L4 6.5l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <span
            style="display:flex;align-items:center;padding:0 0.625rem;font-size:0.8125rem;
                   color:var(--text-secondary);white-space:nowrap"
          >{{ current }} / {{ last }}</span>

          <button
            class="btn btn-secondary btn-sm"
            [disabled]="current >= last"
            (click)="pageChange.emit(current + 1)"
            aria-label="Next page"
            type="button"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M4.5 2L9 6.5 4.5 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PaginationComponent {
  @Input() current = 1;
  @Input() last    = 1;
  @Input() total   = 0;
  @Input() perPage = 10;
  @Input() pageSizeOptions: number[] = [10, 25, 50];

  @Output() pageChange     = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get rangeStart(): number { return Math.min((this.current - 1) * this.perPage + 1, this.total); }
  get rangeEnd():   number { return Math.min(this.current * this.perPage, this.total); }
}

