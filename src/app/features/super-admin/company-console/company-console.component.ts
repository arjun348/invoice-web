import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperAdminService, CompanyTenant } from '../../../core/services/super-admin.service';


type StatusTab = 'pending' | 'active' | 'rejected' | 'suspended';

@Component({
  selector: 'app-company-console',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-console.component.html',
  styleUrls: ['./company-console.component.css']
})
export class CompanyConsoleComponent implements OnInit {
  private adminService = inject(SuperAdminService);

  public tabs: StatusTab[] = ['pending', 'active', 'rejected', 'suspended'];
  public activeTab = signal<StatusTab>('pending');
  public companies = signal<CompanyTenant[]>([]);

  public isLoading = signal(false);
  public successMessage = signal<string | null>(null);
  public errorMessage = signal<string | null>(null);

  public currentPage = signal(1);
  public lastPage = signal(1);

  public showModal = signal(false);
  public modalType = signal<'reject' | 'suspend' | null>(null);
  public targetCompanyId: number | null = null;
  public modalReason: string = '';

  ngOnInit(): void {
    this.loadCompanies();
  }

  public switchTab(tab: StatusTab): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.clearMessages();
    this.loadCompanies();
  }

  public changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage()) {
      this.currentPage.set(page);
      this.loadCompanies();
    }
  }

  private loadCompanies(): void {
    this.isLoading.set(true);
    this.adminService.getCompanies(this.activeTab(), this.currentPage()).subscribe({
      next: (res: any) => {
        this.companies.set(res.data || []);
        this.currentPage.set(res.current_page || 1);
        this.lastPage.set(res.last_page || 1);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to synchronize cloud vendor directory pipelines.');
        this.isLoading.set(false);
      }
    });
  }

  public processApproval(id: number): void {
    this.clearMessages();
    this.adminService.approveCompany(id).subscribe({
      next: () => {
        this.successMessage.set('Company instance successfully approved and activated.');
        this.loadCompanies();
      },
      error: () => this.errorMessage.set('Error attempting to process registration pipeline approval.')
    });
  }

  public openModal(type: 'reject' | 'suspend', id: number): void {
    this.modalType.set(type);
    this.targetCompanyId = id;
    this.modalReason = '';
    this.showModal.set(true);
  }

  public closeModal(): void {
    this.showModal.set(false);
    this.modalType.set(null);
    this.targetCompanyId = null;
  }

  public submitModalAction(): void {
    if (!this.modalReason.trim()) {
      alert('A valid operational reason justification text is mandatory.');
      return;
    }

    const id = this.targetCompanyId!;
    const action$ = this.modalType() === 'reject'
      ? this.adminService.rejectCompany(id, this.modalReason)
      : this.adminService.suspendCompany(id, this.modalReason);

    this.clearMessages();
    this.closeModal();

    action$.subscribe({
      next: () => {
        this.successMessage.set('Organization tenant restriction policy applied successfully.');
        this.loadCompanies();
      },
      error: () => this.errorMessage.set('Failed to cascade systemic restriction values down onto the tenant.')
    });
  }

  public processReactivation(id: number): void {
    this.clearMessages();
    this.adminService.reactivateCompany(id).subscribe({
      next: () => {
        this.successMessage.set('Organization account successfully restored to standard active runtime parameters.');
        this.loadCompanies();
      },
      error: () => this.errorMessage.set('Reactivation mapping rejected by infrastructure endpoints.')
    });
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }
}
