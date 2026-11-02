import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastService } from '../toast/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't intercept login requests with generic redirect
      const isLoginRequest = req.url.includes('/login');

      if (error.status === 401 && !isLoginRequest) {
        auth.logout().subscribe(() => {
          router.navigateByUrl('/login');
          toast.warning('Your session has expired. Please sign in again.');
        });
      } else if (error.status === 403) {
        toast.error("You don't have permission to perform this action.");
      } else if (error.status === 0) {
        toast.error('Unable to connect to server. Please check your connection.');
      } else if (error.status >= 500) {
        toast.error('Server error encountered. Please try again shortly.');
      }

      return throwError(() => error);
    }),
  );
};

