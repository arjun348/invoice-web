import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import {
  Invoice,
  InvoiceStatus,
  PaginationMeta,
} from '../../../core/invoices/invoice.types';
import { InvoiceService } from '../../../core/invoices/invoice.service';

@Component({
  selector: 'app-invoice-list',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  template: `
    <main class="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      <section class="mx-auto max-w-6xl">
        <div class="mb-8">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">
            Invoice Tracker
          </p>
          <h1 class="mt-2 text-3xl font-bold">Invoices</h1>
        </div>

        @if (isAdmin()) {
          <a
            routerLink="/invoices/new"
            class="rounded-lg bg-sky-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-sky-400"
          >
            New invoice
          </a>
        }

        <div class="mb-6 grid gap-3 rounded-xl bg-slate-900 p-4 sm:grid-cols-[1fr_180px_auto]">
          <input
            class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none focus:border-sky-400"
            [(ngModel)]="search"
            (keyup.enter)="load()"
            placeholder="Search invoice number or client"
          />

          <select
            class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 outline-none focus:border-sky-400"
            [(ngModel)]="status"
            (change)="load()"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
          </select>

          <button
            class="rounded-lg bg-sky-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-sky-400"
            (click)="load()"
          >
            Search
          </button>
        </div>

        @if (error()) {
          <div class="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {{ error() }}
          </div>
        } @else if (loading()) {
          <p class="py-12 text-center text-slate-400">Loading invoices…</p>
        } @else if (invoices().length === 0) {
          <div class="rounded-xl border border-dashed border-slate-700 p-12 text-center text-slate-400">
            No invoices found.
          </div>
        } @else {
          <div class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div class="hidden grid-cols-[1.1fr_1.5fr_1fr_1fr_1fr] gap-4 border-b border-slate-800 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
              <span>Invoice</span>
              <span>Client</span>
              <span>Due date</span>
              <span>Status</span>
              <span class="text-right">Amount</span>
            </div>

            @for (invoice of invoices(); track invoice.id) {
              <article class="grid gap-2 border-b border-slate-800 px-5 py-4 last:border-0 md:grid-cols-[1.1fr_1.5fr_1fr_1fr_1fr] md:items-center md:gap-4">
                <div class="font-semibold">{{ invoice.number }}</div>
                <div>
                  <p>{{ invoice.client.name }}</p>
                  @if (invoice.client.company_name) {
                    <p class="text-sm text-slate-400">{{ invoice.client.company_name }}</p>
                  }
                </div>
                <div class="text-sm text-slate-300">{{ invoice.due_date | date: 'mediumDate' }}</div>
                <div>
                  <span class="rounded-full px-2.5 py-1 text-xs font-semibold" [class]="statusClass(invoice.status)">
                    {{ invoice.status }}
                  </span>
                </div>
                <div class="font-semibold md:text-right">
                  {{ invoice.amount | currency: 'AED' : 'symbol' : '1.2-2' }}
                </div>
                @if (isAdmin()) {
                  <div class="flex gap-3 text-sm md:justify-end">
                    <a
                      class="text-sky-400 hover:text-sky-300"
                      [routerLink]="['/invoices', invoice.id, 'edit']"
                    >
                      Edit
                    </a>
                    <button
                      class="text-red-300 hover:text-red-200"
                      (click)="remove(invoice)"
                    >
                      Delete
                    </button>
                  </div>
                }
              </article>
            }
          </div>

          @if (meta(); as pagination) {
            <div class="mt-5 flex items-center justify-between text-sm">
              <span class="text-slate-400">
                {{ pagination.total }} total · Page {{ pagination.current_page }} of {{ pagination.last_page }}
              </span>
              <div class="flex gap-2">
                <button
                  class="rounded-lg border border-slate-700 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                  [disabled]="pagination.current_page === 1"
                  (click)="load(pagination.current_page - 1)"
                >
                  Previous
                </button>
                <button
                  class="rounded-lg border border-slate-700 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                  [disabled]="pagination.current_page === pagination.last_page"
                  (click)="load(pagination.current_page + 1)"
                >
                  Next
                </button>
              </div>
            </div>
          }
        }
      </section>
    </main>
  `,
})
export class InvoiceListComponent {
  private readonly invoiceService = inject(InvoiceService);
  private readonly auth = inject(AuthService);

  readonly isAdmin = computed(() => this.auth.hasRole('admin'));

  readonly invoices = signal<Invoice[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  search = '';
  status: InvoiceStatus | '' = '';

  constructor() {
    this.load();
  }

  load(page = 1): void {
    this.loading.set(true);
    this.error.set(null);

    this.invoiceService
      .list({
        search: this.search.trim() || undefined,
        status: this.status || undefined,
        page,
      })
      .subscribe({
        next: (response) => {
          this.invoices.set(response.data);
          this.meta.set(response.meta);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Unable to load invoices. Please try again.');
          this.loading.set(false);
        },
      });
  }

  remove(invoice: Invoice): void {
    if (!confirm(`Delete invoice ${invoice.number}?`)) {
      return;
    }

    this.invoiceService.delete(invoice.id).subscribe({
      next: () => this.load(this.meta()?.current_page ?? 1),
      error: (response) => {
        this.error.set(
          response.error?.message ?? 'Unable to delete the invoice.',
        );
      },
    });
  }

  statusClass(status: InvoiceStatus): string {
    return {
      draft: 'bg-slate-700 text-slate-200',
      sent: 'bg-amber-500/20 text-amber-300',
      paid: 'bg-emerald-500/20 text-emerald-300',
    }[status];
  }
}