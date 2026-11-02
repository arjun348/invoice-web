import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Client, ClientPayload } from '../../../core/clients/client.types';
import { ClientService } from '../../../core/clients/client.service';
import { PaginationMeta } from '../../../core/invoices/invoice.types';
import { ConfirmDialogService } from '../../../core/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../core/toast/toast.service';
import { SkeletonComponent } from '../../../shared/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

type ClientSort = 'name' | 'company_name' | 'email';

@Component({
  selector: 'app-client-list',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    SkeletonComponent,
    EmptyStateComponent,
    PaginationComponent,
  ],
  template: `
    <main class="min-h-screen bg-[var(--bg-base)] px-4 py-8 text-[var(--text-primary)] sm:px-6 page-enter">
      <section class="mx-auto max-w-6xl">
        <!-- Header -->
        <div class="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
                Directory
              </span>
              @if (!isAdmin()) {
                <span class="badge badge-draft text-xs">Read-only Viewer</span>
              }
            </div>
            <h1 class="mt-1 text-3xl font-bold tracking-tight text-[var(--text-primary)]">Clients</h1>
            <p class="text-sm text-[var(--text-secondary)] mt-0.5">
              Manage client records, contact details, and organization billing info.
            </p>
          </div>
        </div>

        <!-- Add / Edit Client Form (Admin only) -->
        @if (isAdmin()) {
          <section class="surface p-6 mb-8 shadow-sm">
            <div class="flex items-center justify-between pb-4 border-b border-[var(--border-base)] mb-5">
              <h2 class="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-sky-400">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                <span>{{ editingId() ? 'Edit client' : 'Add new client' }}</span>
              </h2>
              @if (editingId()) {
                <span class="badge badge-sent text-xs">Editing mode</span>
              }
            </div>

            <form class="grid gap-4 sm:grid-cols-2" [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <div>
                <label class="field-label" for="client-name">
                  Contact Name <span class="text-red-400">*</span>
                </label>
                <input
                  id="client-name"
                  class="input"
                  [class.error]="form.controls.name.touched && form.controls.name.invalid"
                  formControlName="name"
                  placeholder="e.g. Sarah Jenkins"
                />
                @if (form.controls.name.touched && form.controls.name.hasError('required')) {
                  <p class="field-error">Contact name is required.</p>
                }
              </div>

              <div>
                <label class="field-label" for="client-company">Company Name</label>
                <input
                  id="client-company"
                  class="input"
                  formControlName="company_name"
                  placeholder="e.g. Acme Corporation"
                />
              </div>

              <div>
                <label class="field-label" for="client-email">Email Address</label>
                <input
                  id="client-email"
                  class="input"
                  type="email"
                  [class.error]="form.controls.email.touched && form.controls.email.invalid"
                  formControlName="email"
                  placeholder="contact@company.com"
                />
                @if (form.controls.email.touched && form.controls.email.hasError('email')) {
                  <p class="field-error">Please enter a valid email address.</p>
                }
              </div>

              <div>
                <label class="field-label" for="client-phone">Phone Number</label>
                <input
                  id="client-phone"
                  class="input"
                  type="tel"
                  formControlName="phone"
                  placeholder="+971 50 123 4567"
                />
              </div>

              <div class="flex items-center gap-3 sm:col-span-2 pt-2">
                <button
                  class="btn btn-primary"
                  type="submit"
                  [disabled]="saving()"
                >
                  @if (saving()) {
                    <span class="spinner"></span>
                    <span>Saving…</span>
                  } @else {
                    <span>{{ editingId() ? 'Update client' : 'Save client' }}</span>
                  }
                </button>

                @if (editingId()) {
                  <button
                    class="btn btn-secondary"
                    type="button"
                    (click)="resetForm()"
                  >
                    Cancel
                  </button>
                }
              </div>
            </form>
          </section>
        }

        <!-- Search Bar -->
        <div class="surface p-4 mb-6 shadow-sm">
          <div class="relative max-w-md">
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
              [ngModel]="searchQuery()"
              (ngModelChange)="onSearchInput($event)"
              placeholder="Search clients by name, company, or email…"
              aria-label="Search clients"
            />
          </div>
        </div>

        <!-- Load Error Alert -->
        @if (error()) {
          <div
            class="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
            role="alert"
          >
            <div class="flex items-center gap-3">
              <svg class="w-6 h-6 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
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

        <!-- Client List Table -->
        <div class="surface shadow-sm overflow-hidden">
          @if (loading()) {
            <app-skeleton [rows]="5" [cols]="4"></app-skeleton>
          } @else if (sortedClients().length === 0) {
            <app-empty-state
              [title]="searchQuery() ? 'No clients match your search' : 'No clients added yet'"
              [description]="searchQuery() ? 'Try checking for typos or searching by another term.' : 'Use the form above to add your first client.'"
            ></app-empty-state>
          } @else {
            <div class="data-table-wrap border-0 rounded-none">
              <table class="data-table">
                <thead>
                  <tr>
                    <th
                      class="sortable"
                      [class.sort-asc]="sortField() === 'name' && sortDir() === 'asc'"
                      [class.sort-desc]="sortField() === 'name' && sortDir() === 'desc'"
                      (click)="toggleSort('name')"
                      scope="col"
                    >
                      Client Name
                    </th>
                    <th
                      class="sortable"
                      [class.sort-asc]="sortField() === 'company_name' && sortDir() === 'asc'"
                      [class.sort-desc]="sortField() === 'company_name' && sortDir() === 'desc'"
                      (click)="toggleSort('company_name')"
                      scope="col"
                    >
                      Company
                    </th>
                    <th
                      class="sortable"
                      [class.sort-asc]="sortField() === 'email' && sortDir() === 'asc'"
                      [class.sort-desc]="sortField() === 'email' && sortDir() === 'desc'"
                      (click)="toggleSort('email')"
                      scope="col"
                    >
                      Contact Information
                    </th>
                    @if (isAdmin()) {
                      <th class="text-right" scope="col">Actions</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (client of sortedClients(); track client.id) {
                    <tr>
                      <td class="font-semibold text-[var(--text-primary)]">
                        {{ client.name }}
                      </td>
                      <td class="text-[var(--text-secondary)]">
                        {{ client.company_name || '—' }}
                      </td>
                      <td class="text-sm">
                        <div class="flex flex-col gap-0.5">
                          @if (client.email) {
                            <a [href]="'mailto:' + client.email" class="text-sky-400 hover:underline">
                              {{ client.email }}
                            </a>
                          }
                          @if (client.phone) {
                            <span class="text-[var(--text-muted)] text-xs">{{ client.phone }}</span>
                          }
                          @if (!client.email && !client.phone) {
                            <span class="text-[var(--text-muted)]">—</span>
                          }
                        </div>
                      </td>
                      @if (isAdmin()) {
                        <td class="text-right whitespace-nowrap">
                          <div class="inline-flex items-center gap-2">
                            <button
                              class="btn btn-ghost btn-sm text-sky-400 hover:text-sky-300"
                              (click)="edit(client)"
                              type="button"
                              aria-label="Edit client {{ client.name }}"
                            >
                              Edit
                            </button>
                            <button
                              class="btn btn-ghost btn-sm text-red-400 hover:text-red-300"
                              (click)="remove(client)"
                              type="button"
                              aria-label="Delete client {{ client.name }}"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Client Pagination (Restored & Enhanced) -->
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
export class ClientListComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly clientService = inject(ClientService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly clients = signal<Client[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);

  // Sorting
  readonly sortField = signal<ClientSort>('name');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  private readonly searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  readonly isAdmin = computed(() => this.auth.hasRole('admin'));

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    company_name: [''],
    email: ['', [Validators.email]],
    phone: [''],
  });

  readonly sortedClients = computed(() => {
    const list = [...this.clients()];
    const field = this.sortField();
    const dir = this.sortDir() === 'asc' ? 1 : -1;

    return list.sort((a, b) => {
      const valA = (a[field] ?? '').toLowerCase();
      const valB = (b[field] ?? '').toLowerCase();
      return valA.localeCompare(valB) * dir;
    });
  });

  ngOnInit(): void {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery.set(query);
        this.load(1);
      });

    this.load(1);
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  toggleSort(field: ClientSort): void {
    if (this.sortField() === field) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  load(page = 1): void {
    this.currentPage.set(page);
    this.loading.set(true);
    this.error.set(null);

    this.clientService
      .list({
        search: this.searchQuery().trim() || undefined,
        page,
      })
      .subscribe({
        next: (response) => {
          this.clients.set(response.data);
          this.meta.set(response.meta);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Unable to load client records.');
          this.loading.set(false);
        },
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: ClientPayload = {
      name: value.name,
      company_name: value.company_name || null,
      email: value.email || null,
      phone: value.phone || null,
    };

    this.saving.set(true);
    this.error.set(null);

    const isEdit = !!this.editingId();
    const request = isEdit
      ? this.clientService.update(this.editingId()!, payload)
      : this.clientService.create(payload);

    request.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.toast.success(
          isEdit
            ? `Client "${res.data.name}" updated successfully.`
            : `Client "${res.data.name}" added successfully.`,
        );
        this.resetForm();
        this.load(this.currentPage());
      },
      error: (response) => {
        this.saving.set(false);
        const msg = response.error?.message ?? 'Unable to save client record.';
        this.toast.error(msg);
      },
    });
  }

  edit(client: Client): void {
    this.editingId.set(client.id);
    this.form.setValue({
      name: client.name,
      company_name: client.company_name ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async remove(client: Client): Promise<void> {
    const confirmed = await this.confirm.open({
      title: 'Delete Client',
      message: `Are you sure you want to delete ${client.name}? All associated invoices may also be impacted.`,
      confirmLabel: 'Delete Client',
      cancelLabel: 'Keep Client',
      danger: true,
    });

    if (!confirmed) return;

    this.clientService.delete(client.id).subscribe({
      next: () => {
        this.toast.success(`Client ${client.name} deleted successfully.`);
        this.load(this.currentPage());
      },
      error: (response) => {
        this.toast.error(
          response.error?.message ?? 'Unable to delete client.',
        );
      },
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      company_name: '',
      email: '',
      phone: '',
    });
  }
}
