import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, firstValueFrom, of } from 'rxjs';

export const initializeAuth = () => {
  const authService = inject(AuthService);

  return firstValueFrom(
    authService.getMe().pipe(
      catchError(() => of(null))
    )
  );
}
