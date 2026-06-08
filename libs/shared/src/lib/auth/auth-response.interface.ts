import { User } from '../users/user.interface';

export interface AuthResponse {
  readonly access_token: string;
  readonly user: User;
}
