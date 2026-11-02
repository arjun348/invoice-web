import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginResponse, UserRole } from './auth.types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenKey = 'invoice_token';
  private readonly userKey = 'invoice_user';

  readonly user = signal<AuthUser | null>(this.getStoredUser());
  readonly isAuthenticated = computed(() => Boolean(this.user() && this.token));

  constructor(private readonly http: HttpClient) {}

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.userKey, JSON.stringify(response.user));
          this.user.set(response.user);
        }),
      );
  }

  logout(): Observable<unknown> {
    if (!this.token) {
      this.clearSession();

      return of(null);
    }

    return this.http.post(`${environment.apiUrl}/logout`, {}).pipe(
      catchError(() => of(null)),
      finalize(() => this.clearSession()),
    );
  }

  hasRole(role: UserRole): boolean {
    return this.user()?.role === role;
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.user.set(null);
  }

  private getStoredUser(): AuthUser | null {
    const value = localStorage.getItem(this.userKey);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AuthUser;
    } catch {
      localStorage.removeItem(this.userKey);

      return null;
    }
  }
}