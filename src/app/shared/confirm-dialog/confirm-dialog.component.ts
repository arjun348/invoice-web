import {
  Component, ElementRef, ViewChild, inject, effect,
} from '@angular/core';
import { ConfirmDialogService } from '../../core/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (dialog.state(); as state) {
      <!-- Backdrop -->
      <div
        class="modal-backdrop"
        (click)="onBackdropClick($event)"
        (keydown)="onKeydown($event)"
      >
        <!-- Panel -->
        <div
          class="modal-panel"
          #panel
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-msg"
        >
          <div style="padding:1.5rem 1.5rem 0">
            <h2
              id="confirm-title"
              style="margin:0 0 0.5rem;font-size:1.125rem;font-weight:700;color:var(--text-primary)"
            >{{ state.title }}</h2>
            <p
              id="confirm-msg"
              style="margin:0;font-size:0.875rem;color:var(--text-secondary);line-height:1.6"
            >{{ state.message }}</p>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:0.625rem;padding:1.25rem 1.5rem 1.5rem;margin-top:0.75rem">
            <button
              #cancelBtn
              class="btn btn-secondary"
              (click)="dialog.respond(false)"
              type="button"
            >{{ state.cancelLabel ?? 'Cancel' }}</button>

            <button
              class="btn"
              [class]="state.danger ? 'btn-danger' : 'btn-primary'"
              (click)="dialog.respond(true)"
              type="button"
            >{{ state.confirmLabel ?? 'Confirm' }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly dialog = inject(ConfirmDialogService);

  @ViewChild('cancelBtn') cancelBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild('panel')    panel!:     ElementRef<HTMLDivElement>;

  constructor() {
    // Auto-focus cancel button when dialog opens
    effect(() => {
      if (this.dialog.state()) {
        setTimeout(() => this.cancelBtn?.nativeElement?.focus(), 16);
      }
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.dialog.respond(false);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.dialog.respond(false);
      return;
    }

    // Focus trap inside the panel
    if (event.key === 'Tab') {
      const el = this.panel?.nativeElement;
      if (!el) return;
      const focusable = Array.from(
        el.querySelectorAll<HTMLElement>(
          'button:not([disabled]),[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  }
}

