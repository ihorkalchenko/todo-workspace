import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';


/**
 * Protect routes that require authentication.
 * Redirects to /login if the user is not logged in.
 * */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.user()) {
    return true;
  }

  return router.parseUrl('/login');
};


/**
 * Protects guest-only routes (Login, Signup).
 * Redirects to Dashboard if the user is already logged in.
 * */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.user()) {
    return true;
  }

  return router.parseUrl('/');
};
