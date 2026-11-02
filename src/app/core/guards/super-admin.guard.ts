import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const superAdminGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);

    try {
        const savedUser = localStorage.getItem('invoice_user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            // Explicitly allow entry only if the authenticated user has the super_admin role flag
            if (user && user.role === 'super_admin') {
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
