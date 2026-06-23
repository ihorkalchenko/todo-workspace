import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthResponse, User } from '@todo-workspace/shared-interfaces';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
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

  logout() {
    return this.http.post<{ message: string }>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.user.set(null)),
    );
  }
}
