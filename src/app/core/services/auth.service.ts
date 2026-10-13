import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  defer,
  finalize,
  firstValueFrom,
  from,
  map,
  Observable,
  of,
  shareReplay,
  Subscription,
  switchMap,
  tap,
  throwError,
  timeout,
  timer,
} from 'rxjs';
import { API_URL } from '../config/api';
import { Router } from '@angular/router';

interface Tokens {
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly token = signal<string | null>(null);
  private readonly renewalUnavailable = signal(false);
  readonly accessToken = this.token.asReadonly();
  readonly sessionUnavailable = this.renewalUnavailable.asReadonly();
  private renewal?: Subscription;
  private inFlight?: Observable<string>;
  private version = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.renewal?.unsubscribe());
  }

  login(email: string, password: string) {
    return defer(() => {
      const version = ++this.version;
      this.renewal?.unsubscribe();
      this.token.set(null);
      return this.sessionLock(() =>
        this.http.post<Tokens>(
          `${API_URL}/users/auth/login`,
          { email, password },
          { withCredentials: true },
        ),
      ).pipe(
        tap((response) => {
          if (version !== this.version) throw new Error('Session changed');
          this.acceptToken(response.accessToken);
        }),
      );
    });
  }

  restoreSession(): Observable<boolean> {
    return this.refresh().pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  refresh(): Observable<string> {
    if (this.inFlight) return this.inFlight;
    const version = this.version;
    this.inFlight = this.sessionLock(() =>
      this.http
        .post<Tokens>(`${API_URL}/users/auth/refresh-token`, {}, { withCredentials: true })
        .pipe(timeout(10000)),
    ).pipe(
      map((response) => {
        if (version !== this.version) throw new Error('Session changed');
        this.acceptToken(response.accessToken);
        return response.accessToken;
      }),
      catchError((error) => {
        if (version === this.version) {
          if (error.status === 401) {
            this.clearSession();
            if (this.router.url.startsWith('/ong'))
              void this.router.navigate(['/login'], { queryParams: { expired: '1' } });
          } else {
            this.renewalUnavailable.set(true);
            if (this.token()) this.scheduleRetry();
          }
        }
        return throwError(() => error);
      }),
      finalize(() => {
        this.inFlight = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.inFlight;
  }

  clearSession() {
    ++this.version;
    this.renewal?.unsubscribe();
    this.token.set(null);
    this.renewalUnavailable.set(false);
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.patch<void>(`${API_URL}/users/me/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  logout() {
    return defer(() => {
      ++this.version;
      this.renewal?.unsubscribe();
      // Finish any rotation before revoking the cookie, including an expired access token.
      const pending: Observable<string | null> = this.inFlight ?? of(null);
      return pending.pipe(
        catchError(() => of(null)),
        switchMap(() =>
          this.sessionLock(() =>
            this.http.post<void>(`${API_URL}/users/auth/logout`, {}, { withCredentials: true }),
          ),
        ),
        tap(() => this.clearSession()),
        catchError((error) => {
          if (this.token()) this.scheduleRetry();
          return throwError(() => error);
        }),
      );
    });
  }

  private acceptToken(token: string) {
    this.token.set(token);
    this.renewalUnavailable.set(false);
    this.renewal?.unsubscribe();
    // exp is used only to schedule renewal; authorization is always performed by the API.
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (typeof payload.exp === 'number') {
        const delay = Math.max(5000, payload.exp * 1000 - Date.now() - 60000);
        this.renewal = timer(delay).subscribe(() => this.refresh().subscribe({ error: () => {} }));
      }
    } catch {
      /* A 401 from the API still triggers renewal when exp cannot be read. */
    }
  }

  private scheduleRetry() {
    this.renewal?.unsubscribe();
    this.renewal = timer(30000).subscribe(() => this.refresh().subscribe({ error: () => {} }));
  }

  private sessionLock<T>(work: () => Observable<T>): Observable<T> {
    // Serializes cookie rotation across tabs when Web Locks is available.
    return defer(() =>
      typeof navigator !== 'undefined' && navigator.locks
        ? from(navigator.locks.request('adopetz-session', () => firstValueFrom(work())))
        : work(),
    );
  }
}
