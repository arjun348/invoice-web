import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { adminGuard } from './core/auth/admin.guard';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { tenantGuard } from './core/guards/tenant.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (module) => module.LoginComponent,
      ),
  },
  {
    path: 'invoices',
    canActivate: [authGuard, tenantGuard],
    loadComponent: () =>
      import('./features/invoices/invoice-list/invoice-list.component').then(
        (module) => module.InvoiceListComponent,
      ),
  },
  {
    path: 'invoices/new',
    canActivate: [authGuard, adminGuard, tenantGuard],
    canDeactivate: [pendingChangesGuard],
    loadComponent: () =>
      import('./features/invoices/invoice-form/invoice-form.component').then(
        (module) => module.InvoiceFormComponent,
      ),
  },
  {
    path: 'invoices/:id/edit',
    canActivate: [authGuard, adminGuard, tenantGuard],
    canDeactivate: [pendingChangesGuard],
    loadComponent: () =>
      import('./features/invoices/invoice-form/invoice-form.component').then(
        (module) => module.InvoiceFormComponent,
      ),
  },
  {
    path: 'clients',
    canActivate: [authGuard, tenantGuard],
    loadComponent: () =>
      import('./features/clients/client-list/client-list.component').then(
        (module) => module.ClientListComponent,
      ),
  },
  {
    path: 'super-admin/companies',
    loadComponent: () => import('./features/super-admin/company-console/company-console.component')
      .then(m => m.CompanyConsoleComponent),
    canActivate: [superAdminGuard]
  },
  {
    path: 'team',
    loadComponent: () => import('./features/team/team-list/team-list.component')
      .then(m => m.TeamListComponent),
    canActivate: [authGuard, adminGuard, tenantGuard],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'invoices',
  },
  {
    path: '**',
    redirectTo: 'invoices',
  },
];
