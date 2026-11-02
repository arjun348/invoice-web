import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Client } from '../../../core/clients/client.types';
import { ClientService } from '../../../core/clients/client.service';
import { InvoicePayload, InvoiceService } from '../../../core/invoices/invoice.service';
import { InvoiceStatus } from '../../../core/invoices/invoice.types';

@Component({
  selector: 'app-invoice-form',
  imports: [ReactiveFormsModule],
  template: `
    <main class="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      <section class="mx-auto max-w-2xl">
        <button class="mb-6 text-sm text-sky-400 hover:text-sky-300" (click)="cancel()">
          ← Back to invoices
        </button>

        <div class="rounded-xl bg-slate-900 p-6 shadow-xl ring-1 ring-white/10 sm:p-8">
          <h1 class="text-2xl font-bold">
            {{ editing() ? 'Edit invoice' : 'Create invoice' }}
          </h1>

          @if (error()) {
            <div class="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {{ error() }}
            </div>
          }

          <form class="mt-7 grid gap-5" [formGroup]="form" (ngSubmit)="submit()">
            <label>
              <span class="text-sm font-medium">Client</span>
              <select class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5"
                formControlName="client_id">
                <option [ngValue]="0">Select a client</option>
                @for (client of clients(); track client.id) {
                  <option [ngValue]="client.id">
                    {{ client.name }}{{ client.company_name ? ' · ' + client.company_name : '' }}
                  </option>
                }
              </select>
            </label>

            <div class="grid gap-5 sm:grid-cols-2">
              <label>
                <span class="text-sm font-medium">Invoice number</span>
                <input class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5"
                  formControlName="number" placeholder="INV-001" />
              </label>

              <label>
                <span class="text-sm font-medium">Amount (AED)</span>
                <input class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5"
                  type="number" min="0" step="0.01" formControlName="amount" />
              </label>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <label>
                <span class="text-sm font-medium">Status</span>
                <select class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5"
                  formControlName="status">
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                </select>
              </label>

              <label>
                <span class="text-sm font-medium">Due date</span>
                <input class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5"
                  type="date" formControlName="due_date" />
              </label>
            </div>

            <label>
              <span class="text-sm font-medium">Notes</span>
              <textarea class="mt-2 min-h-28 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5"
                formControlName="notes"></textarea>
            </label>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="rounded-lg border border-slate-700 px-4 py-2.5" (click)="cancel()">
                Cancel
              </button>
              <button type="submit" class="rounded-lg bg-sky-500 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-60"
                [disabled]="loading()">
                {{ loading() ? 'Saving…' : 'Save invoice' }}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  `,
})
export class InvoiceFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly clientService = inject(ClientService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly clients = signal<Client[]>([]);
  readonly loading = signal(false);
  readonly editing = signal(false);
  readonly error = signal<string | null>(null);

  private invoiceId: number | null = null;

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
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please complete all required fields correctly.');

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

    const request = this.invoiceId
      ? this.invoiceService.update(this.invoiceId, payload)
      : this.invoiceService.create(payload);

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => this.router.navigateByUrl('/invoices'),
      error: (response) => {
        this.error.set(
          response.error?.message ?? 'Unable to save the invoice.',
        );
      },
    });
  }

  cancel(): void {
    this.router.navigateByUrl('/invoices');
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
      error: () => this.error.set('Unable to load this invoice.'),
    });
  }
}