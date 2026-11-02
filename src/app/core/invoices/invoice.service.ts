import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Invoice,
  InvoiceStatus,
  PaginatedResponse,
} from './invoice.types';

export interface InvoicePayload {
  client_id: number;
  number: string;
  amount: number;
  status: InvoiceStatus;
  due_date: string;
  notes: string | null;
}

interface ApiResource<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  constructor(private readonly http: HttpClient) {}

  list(filters: {
    search?: string;
    status?: InvoiceStatus;
    page?: number;
  }): Observable<PaginatedResponse<Invoice>> {
    let params = new HttpParams().set('page', filters.page ?? 1);

    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);

    return this.http.get<PaginatedResponse<Invoice>>(
      `${environment.apiUrl}/invoices`,
      { params },
    );
  }

  get(id: number): Observable<ApiResource<Invoice>> {
    return this.http.get<ApiResource<Invoice>>(
      `${environment.apiUrl}/invoices/${id}`,
    );
  }

  create(payload: InvoicePayload): Observable<ApiResource<Invoice>> {
    return this.http.post<ApiResource<Invoice>>(
      `${environment.apiUrl}/invoices`,
      payload,
    );
  }

  update(id: number, payload: InvoicePayload): Observable<ApiResource<Invoice>> {
    return this.http.put<ApiResource<Invoice>>(
      `${environment.apiUrl}/invoices/${id}`,
      payload,
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/invoices/${id}`);
  }
}