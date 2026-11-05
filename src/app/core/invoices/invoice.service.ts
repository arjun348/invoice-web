import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

import {
  ApiResource,
  Invoice,
  InvoiceStatus,
  PaginatedResponse,
} from './invoice.types';

export interface InvoiceItemPayload {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface InvoicePayload {
  client_id: number;
  invoice_date: string;
  due_date: string;
  discount_percentage: number;
  notes: string | null;
  items: InvoiceItemPayload[];
}

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private readonly apiUrl = `${environment.apiUrl}/invoices`;

  constructor(private readonly http: HttpClient) { }

  list(filters: {
    search?: string;
    status?: InvoiceStatus;
    page?: number;
  }): Observable<PaginatedResponse<Invoice>> {
    let params = new HttpParams().set('page', filters.page ?? 1);

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get<PaginatedResponse<Invoice>>(
      this.apiUrl,
      { params },
    );
  }

  get(id: number): Observable<ApiResource<Invoice>> {
    return this.http.get<ApiResource<Invoice>>(
      `${this.apiUrl}/${id}`,
    );
  }

  create(payload: InvoicePayload): Observable<ApiResource<Invoice>> {
    return this.http.post<ApiResource<Invoice>>(
      this.apiUrl,
      payload,
    );
  }

  update(
    id: number,
    payload: InvoicePayload,
  ): Observable<ApiResource<Invoice>> {
    return this.http.put<ApiResource<Invoice>>(
      `${this.apiUrl}/${id}`,
      payload,
    );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${id}`,
    );
  }

  send(id: number): Observable<ApiResource<Invoice>> {
    return this.http.post<ApiResource<Invoice>>(
      `${this.apiUrl}/${id}/send`,
      {},
    );
  }

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${id}/pdf`,
      { responseType: 'blob' },
    );
  }
}
