
import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  Subject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmDialogService } from '../../../core/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../core/toast/toast.service';
import {
  Invoice,
  InvoiceStatus,
  PaginationMeta,
} from '../../../core/invoices/invoice.types';
import { InvoiceService } from '../../../core/invoices/invoice.service';

import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

type SortField = 'number' | 'client' | 'due_date' | 'status' | 'amount';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-invoice-list',
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    RouterLink,
    SkeletonComponent,
    EmptyStateComponent,
    PaginationComponent,
  ],
  template: `
    <main class="min-h-screen bg-[var(--bg-base)] px-4 py-8 text-[var(--text-primary)] sm:px-6 page-enter">
      <section class="mx-auto max-w-6xl">

        <!-- Header -->
        <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
                Billing Management
              </span>

              @if (!isAdmin()) {
                <span class="badge badge-draft text-xs">
                  Read-only Viewer
                </span>
              }
            </div>

            <h1 class="mt-1 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Invoices
            </h1>

            <p class="text-sm text-[var(--text-secondary)] mt-0.5">
              Track, review, and issue invoices to clients.
            </p>
          </div>

          @if (isAdmin()) {
            <a
              routerLink="/invoices/new"
              class="btn btn-primary self-start sm:self-auto"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M8 3v10M3 8h10"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              <span>New invoice</span>
            </a>
          }
        </div>

        <!-- Search and Filters -->
        <div class="surface p-4 mb-6 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <!-- Search -->
            <div class="relative flex-1 max-w-md">
              <svg
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>

              <input
                class="input pl-10"
                [ngModel]="search()"
                (ngModelChange)="onSearchInput($event)"
                placeholder="Search by invoice number or client name…"
                aria-label="Search invoices"
              />

              @if (search()) {
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  (click)="clearSearch()"
                  aria-label="Clear search"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 2l10 10M12 2L2 12"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
              }
            </div>

            <!-- Status Filters -->
            <div
              class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0"
              role="group"
              aria-label="Status filter"
            >
              @for (filter of statusFilters; track filter.value) {
                <button
                  type="button"
                  class="chip"
                  [class.active]="status() === filter.value"
                  (click)="setStatus(filter.value)"
                  [attr.aria-pressed]="status() === filter.value"
                >
                  {{ filter.label }}
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Error Alert -->
        @if (error()) {
          <div
            class="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
            role="alert"
          >
            <div class="flex items-center gap-3">
              <svg
                class="w-6 h-6 text-red-400 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>

              <span>{{ error() }}</span>
            </div>

            <button
              class="btn btn-secondary btn-sm self-start sm:self-auto"
              (click)="load(currentPage())"
              type="button"
            >
              Retry
            </button>
          </div>
        }

        <!-- Invoice Table -->
        <div class="surface shadow-sm overflow-hidden">

          @if (loading()) {
            <app-skeleton [rows]="6" [cols]="6"></app-skeleton>

          } @else if (sortedInvoices().length === 0) {
            <app-empty-state
              [title]="search() || status() ? 'No matching invoices found' : 'No invoices created yet'"
              [description]="search() || status() ? 'Try adjusting your search keywords or clear your filters.' : 'Get started by creating your very first invoice.'"
              [actionLabel]="isAdmin() && !search() && !status() ? 'Create Invoice' : ''"
              (action)="createNew()"
            ></app-empty-state>

          } @else {
            <div class="data-table-wrap border-0 rounded-none">
              <table class="data-table">

                <thead>
                  <tr>
                    <th
                      class="sortable"
                      [class.sort-asc]="sortField() === 'number' && sortDirection() === 'asc'"
                      [class.sort-desc]="sortField() === 'number' && sortDirection() === 'desc'"
                      (click)="toggleSort('number')"
                      scope="col"
                    >
                      Invoice #
                    </th>

                    <th
                      class="sortable"
                      [class.sort-asc]="sortField() === 'client' && sortDirection() === 'asc'"
                      [class.sort-desc]="sortField() === 'client' && sortDirection() === 'desc'"
                      (click)="toggleSort('client')"
                      scope="col"
                    >
                      Client
                    </th>

                    <th
                      class="sortable"
                      [class.sort-asc]="sortField() === 'due_date' && sortDirection() === 'asc'"
                      [class.sort-desc]="sortField() === 'due_date' && sortDirection() === 'desc'"
                      (click)="toggleSort('due_date')"
                      scope="col"
                    >
                      Due Date
                    </th>

                    <th
                      class="sortable"
                      [class.sort-asc]="sortField() === 'status' && sortDirection() === 'asc'"
                      [class.sort-desc]="sortField() === 'status' && sortDirection() === 'desc'"
                      (click)="toggleSort('status')"
                      scope="col"
                    >
                      Status
                    </th>

                    <th
                      class="text-right sortable"
                      [class.sort-asc]="sortField() === 'amount' && sortDirection() === 'asc'"
                      [class.sort-desc]="sortField() === 'amount' && sortDirection() === 'desc'"
                      (click)="toggleSort('amount')"
                      scope="col"
                    >
                      Amount
                    </th>

                    @if (isAdmin()) {
                      <th class="text-right" scope="col">
                        Actions
                      </th>
                    }
                  </tr>
                </thead>

                <tbody>
                  @for (invoice of sortedInvoices(); track invoice.id) {
                    <tr [class.overdue]="isOverdue(invoice)">

                      <!-- Invoice Number -->
                      <td class="font-semibold text-[var(--text-primary)]">
                        <div class="flex items-center gap-2">
                          <a
                            [routerLink]="['/invoices', invoice.id]"
                            class="text-sky-400 hover:text-sky-300 hover:underline"
                          >
                            {{ invoice.number }}
                          </a>

                          @if (isOverdue(invoice)) {
                            <span
                              class="badge badge-overdue text-[10px] py-0 px-1.5"
                              title="Payment is past due date"
                            >
                              Overdue
                            </span>
                          }
                        </div>
                      </td>

                      <!-- Client -->
                      <td>
                        <div class="font-medium text-[var(--text-primary)]">
                          {{ invoice.client?.name ?? 'Unknown client' }}
                        </div>

                        @if (invoice.client?.company_name) {
                          <div class="text-xs text-[var(--text-muted)]">
                            {{ invoice.client?.company_name }}
                          </div>
                        }
                      </td>

                      <!-- Due Date -->
                      <td class="text-sm whitespace-nowrap">
                        <span
                          [class.text-red-400]="isOverdue(invoice)"
                          [class.font-medium]="isOverdue(invoice)"
                        >
                          {{ invoice.due_date | date: 'mediumDate' }}
                        </span>
                      </td>

                      <!-- Status -->
                      <td>
                        <span class="badge" [class]="statusClass(invoice.status)">
                          {{ statusLabel(invoice.status) }}
                        </span>
                      </td>

                      <!-- Financial Information -->
                      <td class="text-right whitespace-nowrap">
                        <div class="font-semibold tabular-nums text-[var(--text-primary)]">
                          {{ invoice.amount | currency: 'AED' : 'symbol' : '1.2-2' }}
                        </div>

                        @if (hasPayments(invoice)) {
                          <div class="mt-1 text-xs text-emerald-400">
                            Paid:
                            {{ invoice.amount_paid | currency: 'AED' : 'symbol' : '1.2-2' }}
                          </div>
                        }

                        @if (invoice.status !== 'paid' && invoice.status !== 'cancelled') {
                          <div class="text-xs text-[var(--text-muted)]">
                            Due:
                            {{ invoice.outstanding_amount | currency: 'AED' : 'symbol' : '1.2-2' }}
                          </div>
                        }
                      </td>

                      <!-- Actions -->
                      @if (isAdmin()) {
                        <td class="text-right whitespace-nowrap">
                          @if (invoice.status === 'draft') {
                            <div class="inline-flex items-center gap-2">
                              <a
                                class="btn btn-ghost btn-sm text-sky-400 hover:text-sky-300"
                                [routerLink]="['/invoices', invoice.id, 'edit']"
                                aria-label="Edit invoice {{ invoice.number }}"
                              >
                                Edit
                              </a>

                              <button
                                class="btn btn-ghost btn-sm text-red-400 hover:text-red-300"
                                (click)="remove(invoice)"
                                [attr.aria-label]="'Delete invoice ' + invoice.number"
                                type="button"
                              >
                                Delete
                              </button>
                            </div>
                          } @else {
                            <span class="text-xs text-[var(--text-muted)]">
                              No actions
                            </span>
                          }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            @if (meta(); as pagination) {
              <app-pagination
                [current]="pagination.current_page"
                [last]="pagination.last_page"
                [total]="pagination.total"
                [perPage]="pagination.per_page"
                (pageChange)="load($event)"
              ></app-pagination>
            }
          }
        </div>
      </section>
    </main>
  `,
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  private readonly invoiceService = inject(InvoiceService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly isAdmin = computed(() => this.auth.hasRole('admin'));

  readonly statusFilters: {
    label: string;
    value: InvoiceStatus | '';
  }[] = [
      { label: 'All', value: '' },
      { label: 'Draft', value: 'draft' },
      { label: 'Sent', value: 'sent' },
      { label: 'Partially Paid', value: 'partially_paid' },
      { label: 'Paid', value: 'paid' },
      { label: 'Cancelled', value: 'cancelled' },
    ];

  readonly invoices = signal<Invoice[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly search = signal('');
  readonly status = signal<InvoiceStatus | ''>('');
  readonly currentPage = signal(1);

  readonly sortField = signal<SortField>('due_date');
  readonly sortDirection = signal<SortDirection>('desc');

  private readonly searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  readonly sortedInvoices = computed(() => {
    const items = [...this.invoices()];
    const field = this.sortField();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return items.sort((a, b) => {
      let comparison = 0;

      switch (field) {
        case 'number':
          comparison = a.number.localeCompare(b.number);
          break;

        case 'client':
          comparison = (a.client?.name ?? '').localeCompare(
            b.client?.name ?? '',
          );
          break;

        case 'due_date':
          comparison =
            new Date(a.due_date).getTime() -
            new Date(b.due_date).getTime();
          break;

        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;

        case 'amount':
          comparison = Number(a.amount) - Number(b.amount);
          break;
      }

      return comparison * direction;
    });
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;

    if (params['search']) {
      this.search.set(params['search']);
    }

    const validStatuses: InvoiceStatus[] = [
      'draft',
      'sent',
      'partially_paid',
      'paid',
      'cancelled',
    ];

    if (validStatuses.includes(params['status'])) {
      this.status.set(params['status']);
    }

    const page = Math.max(1, Number(params['page']) || 1);
    this.currentPage.set(page);

    this.searchSub = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((query) => {
        this.search.set(query);
        this.syncUrlAndLoad(1);
      });

    this.load(page);
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.search.set('');
    this.searchSubject.next('');
  }

  setStatus(value: InvoiceStatus | ''): void {
    this.status.set(value);
    this.syncUrlAndLoad(1);
  }

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.update((direction) =>
        direction === 'asc' ? 'desc' : 'asc',
      );
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  createNew(): void {
    this.router.navigateByUrl('/invoices/new');
  }

  hasPayments(invoice: Invoice): boolean {
    return Number(invoice.amount_paid ?? 0) > 0;
  }

  statusLabel(status: InvoiceStatus): string {
    const labels: Record<InvoiceStatus, string> = {
      draft: 'Draft',
      sent: 'Sent',
      partially_paid: 'Partially Paid',
      paid: 'Paid',
      cancelled: 'Cancelled',
    };

    return labels[status];
  }

  statusClass(status: InvoiceStatus): string {
    const classes: Record<InvoiceStatus, string> = {
      draft: 'badge-draft',
      sent: 'badge-sent',
      partially_paid: 'badge-partial',
      paid: 'badge-paid',
      cancelled: 'badge-cancelled',
    };

    return classes[status];
  }

  isOverdue(invoice: Invoice): boolean {
    if (
      invoice.status === 'draft' ||
      invoice.status === 'paid' ||
      invoice.status === 'cancelled'
    ) {
      return false;
    }

    const dueDate = new Date(invoice.due_date);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return dueDate.getTime() < today.getTime();
  }

  private syncUrlAndLoad(page: number): void {
    this.currentPage.set(page);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.search().trim() || null,
        status: this.status() || null,
        page: page > 1 ? page : null,
      },
      queryParamsHandling: 'merge',
    });

    this.load(page);
  }

  load(page = 1): void {
    this.currentPage.set(page);
    this.loading.set(true);
    this.error.set(null);

    this.invoiceService
      .list({
        search: this.search().trim() || undefined,
        status: this.status() || undefined,
        page,
      })
      .subscribe({
        next: (response) => {
          this.invoices.set(response.data);
          this.meta.set(response.meta);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(
            'Unable to load invoices. Please verify your connection.',
          );
          this.loading.set(false);
        },
      });
  }

  async remove(invoice: Invoice): Promise<void> {
    const confirmed = await this.confirm.open({
      title: 'Delete Invoice',
      message: `Are you sure you want to permanently delete invoice ${invoice.number}? This action cannot be undone.`,
      confirmLabel: 'Delete Invoice',
      cancelLabel: 'Keep Invoice',
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    this.invoiceService.delete(invoice.id).subscribe({
      next: () => {
        this.toast.success(
          `Invoice ${invoice.number} deleted successfully.`,
        );

        this.load(this.meta()?.current_page ?? 1);
      },
      error: (response) => {
        this.toast.error(
          response.error?.message ?? 'Failed to delete the invoice.',
        );
      },
    });
  }
}
