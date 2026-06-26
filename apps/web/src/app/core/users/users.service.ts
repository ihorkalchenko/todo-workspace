import { inject, Injectable } from '@angular/core';
import { UsersDataService } from './users-data.service';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly usersDataService = inject(UsersDataService);

  getUsers(search?: string) {
    return this.usersDataService.getUsers(search);
  }
}
