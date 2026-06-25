import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, Subject, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service';

let isRefreshing = false;
const refreshSubject = new Subject<boolean>();

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authReq = req.clone({ withCredentials: true });
  const isAuthRoute = /\/auth\/(login|signup|refresh)/.test(req.url);

  return next(authReq).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthRoute) {

        if (!isRefreshing) {
          isRefreshing = true;

          return authService.refresh().pipe(
            switchMap(() => {
              isRefreshing = false;
              refreshSubject.next(true);

              return next(req);
            }),
            catchError((error) => {
              isRefreshing = false;
              refreshSubject.next(false);
              authService.clearUser();

              return throwError(() => error);
            }),
          );
        } else {
          return refreshSubject.pipe(
            take(1),
            switchMap((refreshed) => {
              return refreshed ? next(req) : throwError(() => err);
            }),
          );
        }

      }

      return throwError(() => err);
    }),
  );
};
