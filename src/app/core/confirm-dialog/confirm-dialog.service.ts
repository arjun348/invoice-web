import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (result: boolean) => void;
  previousFocus: Element | null;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly state = signal<ConfirmState | null>(null);

  /** Opens a confirm dialog and returns a Promise<boolean>. */
  open(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => {
      this.state.set({
        ...options,
        resolve,
        previousFocus: document.activeElement,
      });
    });
  }

  respond(result: boolean): void {
    const prev = this.state()?.previousFocus as HTMLElement | null;
    this.state()?.resolve(result);
    this.state.set(null);
    // Return focus to the element that triggered the dialog
    setTimeout(() => prev?.focus(), 16);
  }
}

