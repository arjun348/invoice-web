import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const teamManagerGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  try {
    const savedUser = localStorage.getItem('invoice_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user && user.role === 'admin' && user.is_primary_admin === true) {
        return true;
      }
    }
  } catch (e) {
    console.error('Session verification execution failure:', e);
  }

  // Soft fallback: redirect standard operators down to invoices dashboard listing
  router.navigate(['/invoices']);
  return false;
};
