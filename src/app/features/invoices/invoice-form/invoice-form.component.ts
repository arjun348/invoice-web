import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Client } from '../../../core/clients/client.types';
import { ClientService } from '../../../core/clients/client.service';
import { InvoicePayload, InvoiceService } from '../../../core/invoices/invoice.service';
import { InvoiceStatus } from '../../../core/invoices/invoice.types';
import { ConfirmDialogService } from '../../../core/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../core/toast/toast.service';
import { ComponentCanDeactivate } from '../../../core/guards/pending-changes.guard';

const DRAFT_STORAGE_KEY = 'it_invoice_draft';

@Component({
  selector: 'app-invoice-form',
  imports: [ReactiveFormsModule],
  template: `
    <main class="min-h-screen bg-[var(--bg-base)] px-4 py-8 text-[var(--text-primary)] sm:px-6 page-enter">
      <section class="mx-auto max-w-2xl">
        <!-- Breadcrumb / Back button -->
        <button
          class="btn btn-ghost btn-sm mb-6 -ml-2 text-sky-400 hover:text-sky-300"
          (click)="cancel()"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Back to invoices</span>
        </button>

        <div class="surface p-6 shadow-xl sm:p-8">
          <div class="flex items-center justify-between pb-5 border-b border-[var(--border-base)]">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {{ editing() ? 'Edit Invoice' : 'Create Invoice' }}
                </h1>
                @if (form.dirty && !submitted()) {
                  <span class="unsaved-dot" title="Unsaved changes"></span>
                }
              </div>
              <p class="text-sm text-[var(--text-secondary)] mt-1">
                {{ editing() ? 'Update existing invoice details.' : 'Fill in the details to issue a new client invoice.' }}
              </p>
            </div>

            @if (hasDraft() && !editing()) {
              <button
                type="button"
                class="btn btn-secondary btn-sm text-xs"
                (click)="discardDraft()"
                title="Discard restored draft"
              >
                Clear draft
              </button>
            }
          </div>

          <!-- Error Alert / Summary -->
          @if (error()) {
            <div
              class="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 flex items-start gap-3"
              role="alert"
            >
              <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/>
              </svg>
              <div>
                <p class="font-medium">{{ error() }}</p>
                @if (validationErrors().length > 0) {
                  <ul class="list-disc list-inside mt-1.5 space-y-0.5 text-xs text-red-300">
                    @for (err of validationErrors(); track err) {
                      <li>{{ err }}</li>
                    }
                  </ul>
                }
              </div>
            </div>
          }

          <form class="mt-6 space-y-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <!-- Client selector -->
            <div>
              <label class="field-label" for="invoice-client">
                Client <span class="text-red-400">*</span>
              </label>
              <select
                #clientSelect
                id="invoice-client"
                class="input"
                [class.error]="isFieldInvalid('client_id')"
                formControlName="client_id"
                aria-describedby="client-error"
              >
                <option [ngValue]="0" disabled>Select a client…</option>
                @for (client of clients(); track client.id) {
                  <option [ngValue]="client.id">
                    {{ client.name }}{{ client.company_name ? ' · ' + client.company_name : '' }}
                  </option>
                }
              </select>
              @if (isFieldInvalid('client_id')) {
                <p id="client-error" class="field-error" role="alert">Please select a valid client.</p>
              }
            </div>

            <!-- Two-column row: Invoice Number & Amount -->
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="field-label" for="invoice-number">
                  Invoice Number <span class="text-red-400">*</span>
                </label>
                <input
                  id="invoice-number"
                  class="input font-mono"
                  [class.error]="isFieldInvalid('number')"
                  formControlName="number"
                  placeholder="e.g. INV-2026-001"
                  aria-describedby="number-error"
                />
                @if (isFieldInvalid('number')) {
                  <p id="number-error" class="field-error" role="alert">Invoice number is required.</p>
                }
              </div>

              <div>
                <label class="field-label" for="invoice-amount">
                  Amount (AED) <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <input
                    id="invoice-amount"
                    class="input tabular-nums"
                    [class.error]="isFieldInvalid('amount')"
                    type="number"
                    min="0"
                    step="0.01"
                    formControlName="amount"
                    placeholder="0.00"
                    aria-describedby="amount-error"
                  />
                </div>
                @if (isFieldInvalid('amount')) {
                  <p id="amount-error" class="field-error" role="alert">Amount must be greater than or equal to 0.</p>
                }
              </div>
            </div>

            <!-- Two-column row: Status & Due Date -->
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="field-label" for="invoice-status">
                  Status <span class="text-red-400">*</span>
                </label>
                <select
                  id="invoice-status"
                  class="input"
                  [class.error]="isFieldInvalid('status')"
                  formControlName="status"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label class="field-label" for="invoice-due-date">
                  Due Date <span class="text-red-400">*</span>
                </label>
                <input
                  id="invoice-due-date"
                  class="input"
                  [class.error]="isFieldInvalid('due_date')"
                  type="date"
                  formControlName="due_date"
                  aria-describedby="due-date-error"
                />
                @if (isFieldInvalid('due_date')) {
                  <p id="due-date-error" class="field-error" role="alert">Due date is required.</p>
                }
              </div>
            </div>

            <!-- Notes -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="field-label mb-0" for="invoice-notes">Notes & Terms</label>
                <span class="text-xs text-[var(--text-muted)]">Optional</span>
              </div>
              <textarea
                id="invoice-notes"
                class="input"
                formControlName="notes"
                rows="4"
                placeholder="Include payment instructions, bank transfer details, or notes to the client…"
              ></textarea>
            </div>

            <!-- Actions footer -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-base)]">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="cancel()"
                [disabled]="loading()"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary min-w-[8rem]"
                [disabled]="loading()"
              >
                @if (loading()) {
                  <span class="spinner"></span>
                  <span>Saving…</span>
                } @else {
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M13.5 4.5l-6 6-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>{{ editing() ? 'Update invoice' : 'Save invoice' }}</span>
                }
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  `,
})
export class InvoiceFormComponent implements ComponentCanDeactivate {
  private readonly formBuilder = inject(FormBuilder);
  private readonly clientService = inject(ClientService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly clients = signal<Client[]>([]);
  readonly loading = signal(false);
  readonly editing = signal(false);
  readonly error = signal<string | null>(null);
  readonly validationErrors = signal<string[]>([]);
  readonly submitted = signal(false);
  readonly hasDraft = signal(false);

  private invoiceId: number | null = null;

  @ViewChild('clientSelect') clientSelect?: ElementRef<HTMLSelectElement>;

  readonly form = this.formBuilder.nonNullable.group({
    client_id: [0, [Validators.required, Validators.min(1)]],
    number: ['', [Validators.required, Validators.maxLength(255)]],
    amount: [0, [Validators.required, Validators.min(0)]],
    status: ['draft' as InvoiceStatus, [Validators.required]],
    due_date: ['', [Validators.required]],
    notes: [''],
  });

  constructor() {
    this.loadClients();

    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id) {
      this.invoiceId = id;
      this.editing.set(true);
      this.loadInvoice(id);
    } else {
      // Check for saved draft for new invoice
      this.restoreDraft();
      // Listen to value changes to autosave draft
      this.form.valueChanges.subscribe(() => {
        if (!this.editing() && !this.submitted() && this.form.dirty) {
          try {
            sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(this.form.getRawValue()));
            this.hasDraft.set(true);
          } catch (_) {}
        }
      });
    }
  }

  // Guard against unsaved changes on navigation
  async canDeactivate(): Promise<boolean> {
    if (this.form.dirty && !this.submitted()) {
      return await this.confirm.open({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes on this invoice. Are you sure you want to discard them and leave?',
        confirmLabel: 'Discard Changes',
        cancelLabel: 'Keep Editing',
        danger: true,
      });
    }
    return true;
  }

  isFieldInvalid(field: 'client_id' | 'number' | 'amount' | 'status' | 'due_date'): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const errors: string[] = [];
      if (this.form.get('client_id')?.invalid) errors.push('A client must be selected');
      if (this.form.get('number')?.invalid) errors.push('A valid invoice number is required');
      if (this.form.get('amount')?.invalid) errors.push('A valid amount is required (minimum 0)');
      if (this.form.get('due_date')?.invalid) errors.push('A due date must be provided');

      this.validationErrors.set(errors);
      this.error.set('Please resolve the highlighted errors before submitting.');
      return;
    }

    const raw = this.form.getRawValue();
    const payload: InvoicePayload = {
      ...raw,
      amount: Number(raw.amount),
      notes: raw.notes || null,
    };

    this.loading.set(true);
    this.error.set(null);
    this.validationErrors.set([]);

    const request = this.invoiceId
      ? this.invoiceService.update(this.invoiceId, payload)
      : this.invoiceService.create(payload);

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res) => {
        this.submitted.set(true);
        this.clearDraft();
        this.toast.success(
          this.invoiceId
            ? `Invoice ${res.data.number} updated successfully.`
            : `Invoice ${res.data.number} created successfully.`,
        );
        this.router.navigateByUrl('/invoices');
      },
      error: (response) => {
        if (response.status === 422 && response.error?.errors) {
          const apiErrors = Object.values(response.error.errors).flat() as string[];
          this.validationErrors.set(apiErrors);
          this.error.set('Validation failed. Please review your input.');
        } else {
          this.error.set(
            response.error?.message ?? 'Unable to save the invoice. Please try again.',
          );
        }
      },
    });
  }

  async cancel(): Promise<void> {
    if (this.form.dirty && !this.submitted()) {
      const confirmLeave = await this.canDeactivate();
      if (!confirmLeave) return;
    }
    this.router.navigateByUrl('/invoices');
  }

  discardDraft(): void {
    this.clearDraft();
    this.form.reset({
      client_id: 0,
      number: '',
      amount: 0,
      status: 'draft',
      due_date: '',
      notes: '',
    });
    this.hasDraft.set(false);
    this.toast.info('Draft discarded.');
  }

  private restoreDraft(): void {
    try {
      const draft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        this.form.patchValue(parsed);
        this.hasDraft.set(true);
      }
    } catch (_) {}
  }

  private clearDraft(): void {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (_) {}
  }

  private loadClients(): void {
    this.clientService.list().subscribe({
      next: (response) => this.clients.set(response.data),
      error: () => this.error.set('Unable to load clients.'),
    });
  }

  private loadInvoice(id: number): void {
    this.invoiceService.get(id).subscribe({
      next: (response) => {
        const invoice = response.data;
        this.form.patchValue({
          client_id: invoice.client_id,
          number: invoice.number,
          amount: Number(invoice.amount),
          status: invoice.status,
          due_date: invoice.due_date,
          notes: invoice.notes ?? '',
        });
      },
      error: () => this.error.set('Unable to load this invoice details.'),
    });
  }
}
