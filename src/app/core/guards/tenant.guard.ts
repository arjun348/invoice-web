import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const tenantGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  try {
    const savedUser = localStorage.getItem('invoice_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      // Hard restriction: If the role is super_admin, block access to standard corporate tenant routes
      if (user && user.role === 'super_admin') {
        router.navigate(['/super-admin/companies']);
        return false;
      }
    }
  } catch (e) {
    console.error('Tenant protection layer session verification failure:', e);
  }

  // Permit standard business operators (admin, viewer) to load the views
  return true;
};
