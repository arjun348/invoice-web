import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ClientListResponse,
  ClientPayload,
  ClientResource,
} from './client.types';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  constructor(private readonly http: HttpClient) {}

  list(filters: { search?: string; page?: number } = {}): Observable<ClientListResponse> {
    let params = new HttpParams().set('page', filters.page ?? 1);

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<ClientListResponse>(
      `${environment.apiUrl}/clients`,
      { params },
    );
  }

  create(payload: ClientPayload): Observable<ClientResource> {
    return this.http.post<ClientResource>(
      `${environment.apiUrl}/clients`,
      payload,
    );
  }

  update(id: number, payload: ClientPayload): Observable<ClientResource> {
    return this.http.put<ClientResource>(
      `${environment.apiUrl}/clients/${id}`,
      payload,
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/clients/${id}`);
  }
}