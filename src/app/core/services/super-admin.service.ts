import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CompanyTenant {
    id: number;
    name: string;
    status: 'pending' | 'active' | 'rejected' | 'suspended';
    status_reason: string | null;
    approved_at: string | null;
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class SuperAdminService {
    private http = inject(HttpClient);
    // Base collection endpoint matches: admin/companies
    private apiUrl = `${environment.apiUrl}/admin/companies`;

    public getCompanies(status: string, page: number = 1): Observable<any> {
        const params = new HttpParams()
            .set('status', status)
            .set('page', page.toString());

        return this.http.get<any>(this.apiUrl, { params });
    }

    // Adjusted endpoints below to match your singular route parameters: admin/company/{id}/...
    public approveCompany(id: number): Observable<CompanyTenant> {
        return this.http.post<CompanyTenant>(`${environment.apiUrl}/admin/companies/${id}/approve`, {});
    }

    public rejectCompany(id: number, reason: string): Observable<CompanyTenant> {
        return this.http.post<CompanyTenant>(`${environment.apiUrl}/admin/companies/${id}/reject`, { reason });
    }

    public suspendCompany(id: number, reason: string): Observable<CompanyTenant> {
        return this.http.post<CompanyTenant>(`${environment.apiUrl}/admin/companies/${id}/suspend`, { reason });
    }

    public reactivateCompany(id: number): Observable<CompanyTenant> {
        return this.http.post<CompanyTenant>(`${environment.apiUrl}/admin/companies/${id}/reactivate`, {});
    }
}
