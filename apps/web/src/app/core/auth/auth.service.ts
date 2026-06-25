import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

import { AuthResponse, User } from '@todo-workspace/shared-interfaces';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = '/api/auth';

  readonly user = signal<User | null>(null);

  getMe() {
    return this.http.get<AuthResponse>(`${this.apiUrl}/me`).pipe(
      tap(({ user }) => this.user.set(user)),
    );
  }

  updateMe(data: Partial<User>) {
    return this.http.patch<User>(`/api/users/me`, data).pipe(
      tap(updatedUser => this.user.set(updatedUser))
    );
  }

  signup(data: Record<string, unknown>) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, data).pipe(
      tap(({ user }) => this.user.set(user)),
    );
  }

  login(data: Record<string, unknown>) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(({ user }) => this.user.set(user)),
    );
  }

  refresh() {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}).pipe(
      tap(({ user }) => this.user.set(user)),
    );
  }

  logout() {
    return this.http.post<{ message: string }>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.user.set(null)),
    );
  }

  clearUser() {
    this.user.set(null);
    this.router.navigate(['/login']);
  }
}
