/**
 * User management contract — source: backend docs/api/auth.md "User management".
 */

export type UserRole = 'admin' | 'user' | 'test';

export interface UserAdmin {
  id: number;
  email: string;
  display_name: string | null;
  role: UserRole;
  last_login_at: string | null;
  legacy_sub: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  users: UserAdmin[];
  count: number;
}

export interface UserCreateRequest {
  email: string;
  /** 10-256 chars; omit to have one generated */
  password?: string;
  display_name?: string | null;
  role?: UserRole;
}

export interface UserCreateResponse {
  user: UserAdmin;
  /** Only when no password was sent; shown once */
  generated_password: string | null;
}

/** Only the fields present are changed */
export interface UserUpdateRequest {
  display_name?: string | null;
  role?: UserRole;
  is_active?: boolean;
  password?: string;
  legacy_sub?: string | null;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}
