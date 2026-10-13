import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, switchMap, throwError } from 'rxjs';
import { API_URL } from '../config/api';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isApi = request.url.startsWith(`${API_URL}/`);
  const isAuth = request.url.startsWith(`${API_URL}/users/auth/`);
  const token = auth.accessToken();
  if (!isApi || isAuth || !token) return next(request);
  const authorized = (value: string) =>
    request.clone({ setHeaders: { Authorization: `Bearer ${value}` } });
  return next(authorized(token)).pipe(
    catchError((error) => {
      // Wrong current password is a business error, not an expired bearer token.
      if (error.status !== 401 || error.error?.errorCode === 'INVALID_CREDENTIALS')
        return throwError(() => error);
      const current = auth.accessToken();
      return (current && current !== token ? of(current) : auth.refresh()).pipe(
        switchMap((newToken) => next(authorized(newToken))),
        catchError((renewalError) => {
          if (renewalError.status === 401) {
            auth.clearSession();
            void router.navigate(['/login'], { queryParams: { expired: '1' } });
          }
          return throwError(() => renewalError);
        }),
      );
    }),
  );
};
