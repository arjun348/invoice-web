import { Component, Input } from '@angular/core';

interface ColConfig { flex: string; maxWidth: string; }

@Component({
  selector: 'app-skeleton',
  template: `
    <div aria-hidden="true" aria-busy="true" aria-label="Loading content">
      @for (row of rowsArr; track $index) {
        <div style="display:flex;gap:1rem;padding:1rem 1.25rem;border-bottom:1px solid var(--border-base);align-items:center">
          @for (col of colsArr; track $index) {
            <div
              class="skeleton"
              [style.height.px]="14"
              [style.flex]="col.flex"
              [style.maxWidth]="col.maxWidth"
            ></div>
          }
        </div>
      }
    </div>
  `,
})
export class SkeletonComponent {
  @Input() rows = 5;
  @Input() cols = 5;

  get rowsArr(): unknown[] { return Array(this.rows); }

  get colsArr(): ColConfig[] {
    return Array.from({ length: this.cols }, (_, i) => ({
      flex: i === this.cols - 1 ? '0 0 5rem' : '1',
      maxWidth: i === this.cols - 1 ? '5rem' : 'none',
    }));
  }
}

