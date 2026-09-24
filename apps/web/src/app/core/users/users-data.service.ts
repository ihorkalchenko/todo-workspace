import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { User } from '@todo-workspace/users';

@Injectable({
  providedIn: 'root',
})
export class UsersDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/users';

  getUsers(search?: string) {
    return this.http.get<User[]>(this.apiUrl, {
      params: search ? { search } : {},
    });
  }
}
