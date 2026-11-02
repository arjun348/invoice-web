export type UserRole = 'admin' | 'viewer' | 'super_admin';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  company_id: number;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}