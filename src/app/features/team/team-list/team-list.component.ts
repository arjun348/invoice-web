import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/toast/toast.service';
import { environment } from '../../../../environments/environment';

export interface TenantUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'viewer' | 'super_admin';
  created_at: string;
}

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './team-list.component.html',
  styleUrls: ['./team-list.component.css']
})
export class TeamListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  private readonly apiUrl = `${environment.apiUrl}/users`;

  public users = signal<TenantUser[]>([]);
  public isLoading = signal(false);
  public isSaving = signal(false);
  public errorMessage = signal<string | null>(null);

  // User Add Form Layout State
  public showAddForm = signal(false);
  public userForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['viewer', [Validators.required, Validators.pattern(/^(admin|viewer)$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit(): void {
    this.loadTeamMembers();
  }

  public loadTeamMembers(): void {
    this.isLoading.set(true);
    this.http.get<TenantUser[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to sync corporate directory records.');
        this.isLoading.set(false);
      }
    });
  }

  public submitNewUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    this.http.post<TenantUser>(this.apiUrl, this.userForm.value).subscribe({
      next: () => {
        this.toast.success('Team member provisioned successfully.');
        this.userForm.reset({ role: 'viewer' });
        this.showAddForm.set(false);
        this.isSaving.set(false);
        this.loadTeamMembers();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        if (err.status === 422 && err.error?.errors) {
          this.errorMessage.set(Object.values(err.error.errors).flat().join(' '));
        } else {
          this.errorMessage.set(err.error?.message || 'Failed to provision workspace operator.');
        }
      }
    });
  }

  public deleteUser(targetUser: TenantUser): void {
    const currentUserId = this.auth.user()?.id;

    if (targetUser.id === currentUserId) {
      this.toast.error('Strategic lock: You are prohibited from deleting your own session.');
      return;
    }

    if (targetUser.role === 'admin') {
      const remainingAdmins = this.users().filter(u => u.role === 'admin').length;
      if (remainingAdmins <= 1) {
        this.toast.error('Validation failure: At least one administrator must remain active.');
        return;
      }
    }

    if (!confirm(`Are you certain you want to revoke access privileges for ${targetUser.name}?`)) {
      return;
    }

    this.http.delete(`${this.apiUrl}/${targetUser.id}`).subscribe({
      next: () => {
        this.toast.success('User access revoked cleanly.');
        this.loadTeamMembers();
      },
      error: (err: HttpErrorResponse) => {
        this.toast.error(err.error?.message || 'Server declined operational delete command.');
      }
    });
  }
}
