
import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Client } from '../../../core/clients/client.types';
import { ClientService } from '../../../core/clients/client.service';
import { InvoicePayload, InvoiceService } from '../../../core/invoices/invoice.service';
import { ConfirmDialogService } from '../../../core/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../core/toast/toast.service';
import { ComponentCanDeactivate } from '../../../core/guards/pending-changes.guard';

const DRAFT_STORAGE_KEY = 'it_invoice_draft';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="min-h-screen bg-[var(--bg-base)] px-4 py-8 text-[var(--text-primary)] sm:px-6 page-enter">
      <section class="mx-auto max-w-3xl">
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
                {{ editing() ? 'Update your draft invoice details.' : 'Create a new invoice for your client.' }}
              </p>
            </div>

            @if (hasDraft() && !editing()) {
              <button
                type="button"
                class="btn btn-secondary btn-sm text-xs"
                (click)="discardDraft()"
              >
                Clear draft
              </button>
            }
          </div>

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
                    @for (err of validationErrors(); track $index) {
                      <li>{{ err }}</li>
                    }
                  </ul>
                }
              </div>
            </div>
          }

          <form class="mt-6 space-y-6" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <!-- Client -->
            <div>
              <label class="field-label" for="invoice-client">
                Client <span class="text-red-400">*</span>
              </label>
              <select
                id="invoice-client"
                class="input"
                [class.error]="isFieldInvalid('client_id')"
                formControlName="client_id"
              >
                <option [ngValue]="0" disabled>Select a client…</option>
                @for (client of clients(); track client.id) {
                  <option [ngValue]="client.id">
                    {{ client.name }}{{ client.company_name ? ' · ' + client.company_name : '' }}
                  </option>
                }
              </select>
              @if (isFieldInvalid('client_id')) {
                <p class="field-error" role="alert">Please select a client.</p>
              }
            </div>

            <!-- Dates -->
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="field-label" for="invoice-date">
                  Invoice Date <span class="text-red-400">*</span>
                </label>
                <input
                  id="invoice-date"
                  class="input"
                  [class.error]="isFieldInvalid('invoice_date')"
                  type="date"
                  formControlName="invoice_date"
                />
                @if (isFieldInvalid('invoice_date')) {
                  <p class="field-error" role="alert">Invoice date is required.</p>
                }
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
                />
                @if (isFieldInvalid('due_date')) {
                  <p class="field-error" role="alert">Due date is required and cannot be before the invoice date.</p>
                }
              </div>
            </div>

            <!-- Line items -->
            <section class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-base font-semibold">Invoice Items</h2>
                  <p class="text-xs text-[var(--text-muted)] mt-1">
                    Add the products or services included in this invoice.
                  </p>
                </div>
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  (click)="addItem()"
                >
                  <span class="text-lg leading-none">+</span>
                  Add item
                </button>
              </div>

              <div formArrayName="items" class="space-y-4">
                @for (item of items.controls; track $index; let i = $index) {
                  <div
                    [formGroupName]="i"
                    class="rounded-xl border border-[var(--border-base)] p-4 space-y-4"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-semibold text-[var(--text-secondary)]">
                        Item {{ i + 1 }}
                      </span>
                      @if (items.length > 1) {
                        <button
                          type="button"
                          class="text-xs text-red-400 hover:text-red-300"
                          (click)="removeItem(i)"
                        >
                          Remove
                        </button>
                      }
                    </div>

                    <div>
                      <label class="field-label" [for]="'item-description-' + i">
                        Description <span class="text-red-400">*</span>
                      </label>
                      <input
                        [id]="'item-description-' + i"
                        class="input"
                        [class.error]="isItemFieldInvalid(i, 'description')"
                        formControlName="description"
                        placeholder="e.g. Website development"
                      />
                      @if (isItemFieldInvalid(i, 'description')) {
                        <p class="field-error">Description is required.</p>
                      }
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label class="field-label" [for]="'item-quantity-' + i">
                          Quantity <span class="text-red-400">*</span>
                        </label>
                        <input
                          [id]="'item-quantity-' + i"
                          class="input tabular-nums"
                          [class.error]="isItemFieldInvalid(i, 'quantity')"
                          type="number"
                          min="0.001"
                          step="0.001"
                          formControlName="quantity"
                          placeholder="1"
                        />
                        @if (isItemFieldInvalid(i, 'quantity')) {
                          <p class="field-error">Quantity must be greater than 0 (up to 3 decimal places).</p>
                        }
                      </div>

                      <div>
                        <label class="field-label" [for]="'item-price-' + i">
                          Unit Price (AED) <span class="text-red-400">*</span>
                        </label>
                        <input
                          [id]="'item-price-' + i"
                          class="input tabular-nums"
                          [class.error]="isItemFieldInvalid(i, 'unit_price')"
                          type="number"
                          min="0"
                          step="0.01"
                          formControlName="unit_price"
                          placeholder="0.00"
                        />
                        @if (isItemFieldInvalid(i, 'unit_price')) {
                          <p class="field-error">Unit price must be 0 or greater.</p>
                        }
                      </div>
                    </div>

                    <div class="flex justify-end border-t border-[var(--border-base)] pt-3">
                      <span class="text-sm text-[var(--text-secondary)]">
                        Line total:
                        <strong class="ml-1 text-[var(--text-primary)] tabular-nums">
                          AED {{ lineTotal(i).toFixed(2) }}
                        </strong>
                      </span>
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- Discount -->
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="field-label" for="discount-percentage">
                  Discount (%)
                </label>
                <input
                  id="discount-percentage"
                  class="input tabular-nums"
                  [class.error]="isFieldInvalid('discount_percentage')"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  formControlName="discount_percentage"
                  placeholder="0"
                />
                @if (isFieldInvalid('discount_percentage')) {
                  <p class="field-error">Discount must be between 0 and 100.</p>
                }
              </div>

              <div class="flex items-end">
                <p class="text-xs text-[var(--text-muted)] pb-3">
                  VAT is fixed at 5% and calculated by the server after discount.
                </p>
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
                placeholder="Payment instructions, bank transfer details, or notes to the client…"
              ></textarea>
            </div>

            <!-- Estimated totals -->
            <section class="rounded-xl border border-[var(--border-base)] bg-[var(--bg-base)] p-4">
              <h2 class="text-sm font-semibold mb-3">Estimated Invoice Summary</h2>

              <div class="space-y-2 text-sm">
                <div class="flex justify-between text-[var(--text-secondary)]">
                  <span>Subtotal</span>
                  <span class="tabular-nums">AED {{ preview.subtotal.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-[var(--text-secondary)]">
                  <span>Discount ({{ preview.discountPercentage.toFixed(2) }}%)</span>
                  <span class="tabular-nums">− AED {{ preview.discountAmount.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-[var(--text-secondary)]">
                  <span>Taxable Amount</span>
                  <span class="tabular-nums">AED {{ preview.taxableAmount.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-[var(--text-secondary)]">
                  <span>VAT (5%)</span>
                  <span class="tabular-nums">AED {{ preview.vatAmount.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between border-t border-[var(--border-base)] pt-3 mt-3 text-base font-bold">
                  <span>Total (AED)</span>
                  <span class="tabular-nums">AED {{ preview.total.toFixed(2) }}</span>
                </div>
              </div>
              <p class="text-xs text-[var(--text-muted)] mt-3">
                These figures are estimates. The final invoice totals are calculated by Laravel.
              </p>
            </section>

            <!-- Actions -->
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
                  <span>{{ editing() ? 'Update invoice' : 'Save draft' }}</span>
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

  readonly form = this.formBuilder.nonNullable.group({
    client_id: [0, [Validators.required, Validators.min(1)]],
    invoice_date: [this.today(), [Validators.required]],
    due_date: [this.today(), [Validators.required]],
    discount_percentage: [0, [Validators.min(0), Validators.max(100)]],
    notes: [''],
    items: this.formBuilder.array([this.createItemGroup()]),
  });

  get items(): FormArray {
    return this.form.controls.items;
  }

  get preview() {
    const subtotal = this.items.controls.reduce((sum, item) => {
      const quantity = Number(item.get('quantity')?.value) || 0;
      const price = Number(item.get('unit_price')?.value) || 0;
      return sum + quantity * price;
    }, 0);

    const discountPercentage = Number(this.form.controls.discount_percentage.value) || 0;
    const discountAmount = subtotal * discountPercentage / 100;
    const taxableAmount = subtotal - discountAmount;
    const vatAmount = taxableAmount * 0.05;

    return {
      subtotal,
      discountPercentage,
      discountAmount,
      taxableAmount,
      vatAmount,
      total: taxableAmount + vatAmount,
    };
  }

  constructor() {
    this.loadClients();

    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id) {
      this.invoiceId = id;
      this.editing.set(true);
      this.loadInvoice(id);
    } else {
      this.restoreDraft();

      this.form.valueChanges.subscribe(() => {
        if (!this.editing() && !this.submitted() && this.form.dirty) {
          try {
            sessionStorage.setItem(
              DRAFT_STORAGE_KEY,
              JSON.stringify(this.form.getRawValue()),
            );
            this.hasDraft.set(true);
          } catch {
            // Storage may be unavailable.
          }
        }
      });
    }
  }

  private today(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private createItemGroup() {
    return this.formBuilder.nonNullable.group({
      description: ['', [Validators.required, Validators.maxLength(1000)]],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unit_price: [0, [Validators.required, Validators.min(0)]],
    });
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
    this.form.markAsDirty();
  }

  removeItem(index: number): void {
    if (this.items.length <= 1) return;

    this.items.removeAt(index);
    this.form.markAsDirty();
  }

  lineTotal(index: number): number {
    const item = this.items.at(index).getRawValue();
    return (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  isItemFieldInvalid(index: number, field: string): boolean {
    const control = this.items.at(index).get(field);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

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

  submit(): void {
    this.error.set(null);
    this.validationErrors.set([]);

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      const errors: string[] = [];

      if (this.form.controls.client_id.invalid) {
        errors.push('A valid client must be selected.');
      }

      if (this.form.controls.invoice_date.invalid) {
        errors.push('Invoice date is required.');
      }

      if (this.form.controls.due_date.invalid) {
        errors.push('A valid due date is required.');
      }

      if (this.form.controls.discount_percentage.invalid) {
        errors.push('Discount must be between 0 and 100.');
      }

      if (this.items.invalid) {
        errors.push('Please check all invoice item descriptions, quantities and prices.');
      }

      this.validationErrors.set(errors);
      this.error.set('Please resolve the highlighted errors before submitting.');
      return;
    }

    const raw = this.form.getRawValue();

    if (raw.due_date < raw.invoice_date) {
      this.form.controls.due_date.setErrors({ dateBeforeInvoice: true });
      this.form.controls.due_date.markAsTouched();
      this.error.set('Due date cannot be earlier than invoice date.');
      this.validationErrors.set(['Due date must be on or after invoice date.']);
      return;
    }

    const payload: InvoicePayload = {
      client_id: Number(raw.client_id),
      invoice_date: raw.invoice_date,
      due_date: raw.due_date,
      discount_percentage: Number(raw.discount_percentage),
      notes: raw.notes.trim() || null,
      items: raw.items.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
    };

    this.loading.set(true);

    const request = this.invoiceId
      ? this.invoiceService.update(this.invoiceId, payload)
      : this.invoiceService.create(payload);

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (response) => {
        this.submitted.set(true);
        this.clearDraft();

        this.toast.success(
          this.invoiceId
            ? `Invoice ${response.data.number} updated successfully.`
            : `Invoice ${response.data.number} created successfully.`,
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
      invoice_date: this.today(),
      due_date: this.today(),
      discount_percentage: 0,
      notes: '',
    });

    while (this.items.length > 1) {
      this.items.removeAt(this.items.length - 1);
    }

    this.items.at(0).reset({
      description: '',
      quantity: 1,
      unit_price: 0,
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.hasDraft.set(false);

    this.toast.info('Draft discarded.');
  }

  private restoreDraft(): void {
    try {
      const draft = sessionStorage.getItem(DRAFT_STORAGE_KEY);

      if (!draft) return;

      const parsed = JSON.parse(draft);

      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        while (this.items.length > 0) {
          this.items.removeAt(0);
        }

        parsed.items.forEach((item: {
          description?: string;
          quantity?: number;
          unit_price?: number;
        }) => {
          const group = this.createItemGroup();
          group.patchValue({
            description: item.description ?? '',
            quantity: Number(item.quantity ?? 1),
            unit_price: Number(item.unit_price ?? 0),
          });
          this.items.push(group);
        });
      }

      this.form.patchValue({
        client_id: Number(parsed.client_id ?? 0),
        invoice_date: parsed.invoice_date ?? this.today(),
        due_date: parsed.due_date ?? this.today(),
        discount_percentage: Number(parsed.discount_percentage ?? 0),
        notes: parsed.notes ?? '',
      });

      this.form.markAsPristine();
      this.hasDraft.set(true);
    } catch {
      this.clearDraft();
    }
  }

  private clearDraft(): void {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Storage may be unavailable.
    }
  }

  private loadClients(): void {
    this.clientService.list().subscribe({
      next: (response) => this.clients.set(response.data),
      error: () => this.error.set('Unable to load clients.'),
    });
  }

  private loadInvoice(id: number): void {
    this.loading.set(true);

    this.invoiceService.get(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          const invoice = response.data;

          if (invoice.status !== 'draft') {
            this.error.set('Only draft invoices can be edited.');
            this.form.disable();
            return;
          }

          const invoiceItems = invoice.items ?? [];

          while (this.items.length > 0) {
            this.items.removeAt(0);
          }

          if (invoiceItems.length > 0) {
            invoiceItems.forEach((item) => {
              const group = this.createItemGroup();
              group.patchValue({
                description: item.description,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
              });
              this.items.push(group);
            });
          } else {
            this.items.push(this.createItemGroup());
          }

          this.form.patchValue({
            client_id: invoice.client_id,
            invoice_date: invoice.invoice_date ?? this.today(),
            due_date: invoice.due_date,
            discount_percentage: Number(invoice.discount_percentage),
            notes: invoice.notes ?? '',
          });

          this.form.markAsPristine();
          this.form.markAsUntouched();
        },
        error: (response) => {
          this.error.set(
            response.error?.message ?? 'Unable to load this invoice details.',
          );
        },
      });
  }
}
