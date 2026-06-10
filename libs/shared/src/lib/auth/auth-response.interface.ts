import { User } from '../users/user.interface';

export interface AuthResponse {
  readonly user: User;
}
