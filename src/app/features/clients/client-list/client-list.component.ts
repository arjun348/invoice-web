import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { Client, ClientPayload } from '../../../core/clients/client.types';
import { ClientService } from '../../../core/clients/client.service';
import { PaginationMeta } from '../../../core/invoices/invoice.types';

@Component({
  selector: 'app-client-list',
  imports: [ReactiveFormsModule],
  template: `
    <main class="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      <section class="mx-auto max-w-6xl">
        <h1 class="text-3xl font-bold">Clients</h1>

        @if (isAdmin()) {
          <section class="mt-6 rounded-xl bg-slate-900 p-5 ring-1 ring-white/10">
            <h2 class="text-lg font-semibold">
              {{ editingId() ? 'Edit client' : 'Add client' }}
            </h2>

            <form class="mt-4 grid gap-4 sm:grid-cols-2" [formGroup]="form" (ngSubmit)="submit()">
              <input class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5"
                formControlName="name" placeholder="Contact name" />
              <input class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5"
                formControlName="company_name" placeholder="Company name" />
              <input class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5"
                formControlName="email" type="email" placeholder="Email" />
              <input class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5"
                formControlName="phone" placeholder="Phone" />

              <div class="flex gap-3 sm:col-span-2">
                <button class="rounded-lg bg-sky-500 px-4 py-2.5 font-semibold text-slate-950"
                  type="submit" [disabled]="saving()">
                  {{ saving() ? 'Saving…' : 'Save client' }}
                </button>
                @if (editingId()) {
                  <button class="rounded-lg border border-slate-700 px-4 py-2.5"
                    type="button" (click)="resetForm()">
                    Cancel
                  </button>
                }
              </div>
            </form>
          </section>
        }

        @if (error()) {
          <p class="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200">
            {{ error() }}
          </p>
        }

        <section class="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          @if (clients().length === 0) {
            <p class="p-10 text-center text-slate-400">No clients found.</p>
          }

          @for (client of clients(); track client.id) {
            <article class="flex flex-col gap-3 border-b border-slate-800 p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="font-semibold">{{ client.name }}</p>
                <p class="text-sm text-slate-400">
                  {{ client.company_name || 'No company name' }}
                  @if (client.email) { · {{ client.email }} }
                  @if (client.phone) { · {{ client.phone }} }
                </p>
              </div>

              @if (isAdmin()) {
                <div class="flex gap-3 text-sm">
                  <button class="text-sky-400 hover:text-sky-300" (click)="edit(client)">Edit</button>
                  <button class="text-red-300 hover:text-red-200" (click)="remove(client)">Delete</button>
                </div>
              }
            </article>
          }
        </section>
      </section>
    </main>
  `,
})
export class ClientListComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly clientService = inject(ClientService);
  private readonly auth = inject(AuthService);

  readonly clients = signal<Client[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly isAdmin = computed(() => this.auth.hasRole('admin'));

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    company_name: [''],
    email: [''],
    phone: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.clientService.list().subscribe({
      next: (response) => {
        this.clients.set(response.data);
        this.meta.set(response.meta);
      },
      error: () => this.error.set('Unable to load clients.'),
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

    const request = this.editingId()
      ? this.clientService.update(this.editingId()!, payload)
      : this.clientService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.resetForm();
        this.load();
      },
      error: (response) => {
        this.saving.set(false);
        this.error.set(response.error?.message ?? 'Unable to save the client.');
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
  }

  remove(client: Client): void {
    if (!confirm(`Delete ${client.name}?`)) {
      return;
    }

    this.clientService.delete(client.id).subscribe({
      next: () => this.load(),
      error: (response) => {
        this.error.set(response.error?.message ?? 'Unable to delete the client.');
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