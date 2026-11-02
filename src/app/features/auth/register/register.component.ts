import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public isPendingApproval = signal<boolean>(false);
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  public signupForm: FormGroup = this.fb.group({
    company_name: ['', [Validators.required, Validators.maxLength(255)]],
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  private passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirm = g.get('password_confirmation')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  public onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.registerCompany(this.signupForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isPendingApproval.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 422 && err.error?.errors) {
          const validationErrors = Object.values(err.error.errors).flat().join(' ');
          this.errorMessage.set(validationErrors);
        } else {
          this.errorMessage.set(err.error?.message || 'Failed to complete registration pipeline setup.');
        }
      }
    });
  }
}
