import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'it-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Reactive current theme signal */
  readonly theme = signal<Theme>(this.resolveInitial());

  constructor() {
    // Whenever the signal changes, apply to DOM + persist
    effect(() => {
      const t = this.theme();
      const root = document.documentElement;
      root.classList.toggle('dark', t === 'dark');
      root.classList.toggle('light', t === 'light');
      try {
        localStorage.setItem(STORAGE_KEY, t);
      } catch (_) {}
    });
  }

  toggle(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private resolveInitial(): Theme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch (_) {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}

