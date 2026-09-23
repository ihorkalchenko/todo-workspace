import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { User } from '@todo-workspace/users';
import { AuthResponse } from '@todo-workspace/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';

  getMe() {
    return this.http.get<AuthResponse>(`${this.apiUrl}/me`);
  }

  login(credentials: Record<string, unknown>) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials);
  }

  signup(data: Record<string, unknown>) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, data);
  }

  refresh() {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {});
  }

  logout() {
    return this.http.post<{ message: string }>(`${this.apiUrl}/logout`, {});
  }

  updateMe(data: Partial<User>) {
    return this.http.patch<User>('/api/users/me', data);
  }
}
