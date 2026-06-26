import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { User } from '@todo-workspace/shared-interfaces';

@Injectable({
  providedIn: 'root',
})
export class UsersDataService {
  private readonly http = inject(HttpClient);

  getUsers(search?: string) {
    return this.http.get<User[]>('api/users', {
      params: search ? { search } : {},
    });
  }
}
