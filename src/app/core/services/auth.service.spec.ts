import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { environment } from '../../../environments/environment';

describe('In-memory session lifecycle', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let client: HttpClient;
  const endpoint = `${environment.apiUrl}/users/auth/refresh-token`;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });
  afterEach(() => {
    auth.clearSession();
    http.verify();
    vi.useRealTimers();
  });
  function login(token = 'first-token') {
    auth.login('ong@example.org', 'test-password').subscribe();
    http.expectOne(`${environment.apiUrl}/users/auth/login`).flush({ accessToken: token });
  }
  it('keeps JWT out of persistent browser storage', () => {
    const persist = vi.spyOn(Storage.prototype, 'setItem');
    login();
    expect(auth.accessToken()).toBe('first-token');
    expect(persist).not.toHaveBeenCalled();
    auth.clearSession();
    expect(auth.accessToken()).toBeNull();
  });
  it('shares one renewal for concurrent 401s and retries with the new bearer token', () => {
    login();
    let successes = 0;
    client.get(`${environment.apiUrl}/pets/me`).subscribe(() => successes++);
    client.get(`${environment.apiUrl}/pets/me/example`).subscribe(() => successes++);
    http.expectOne(`${environment.apiUrl}/pets/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne(`${environment.apiUrl}/pets/me/example`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    const refresh = http.expectOne(endpoint);
    expect(refresh.request.withCredentials).toBe(true);
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    refresh.flush({ accessToken: 'renewed-token' });
    const retries = http.match((req) => req.url.startsWith(`${environment.apiUrl}/pets/me`));
    expect(retries.length).toBe(2);
    retries.forEach((request) => {
      expect(request.request.headers.get('Authorization')).toBe('Bearer renewed-token');
      request.flush({});
    });
    expect(successes).toBe(2);
  });
  it('does not loop when the retried request is unauthorized', () => {
    login();
    let failed = false;
    client.get(`${environment.apiUrl}/pets/me`).subscribe({
      error: () => {
        failed = true;
      },
    });
    http.expectOne(`${environment.apiUrl}/pets/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectOne(endpoint).flush({ accessToken: 'renewed-token' });
    http.expectOne(`${environment.apiUrl}/pets/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectNone(endpoint);
    expect(failed).toBe(true);
    expect(auth.accessToken()).toBeNull();
  });
  it('keeps the current session on a transient renewal failure', () => {
    login();
    client.get(`${environment.apiUrl}/pets/me`).subscribe({ error: () => {} });
    http.expectOne(`${environment.apiUrl}/pets/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectOne(endpoint).error(new ProgressEvent('error'));
    expect(auth.accessToken()).toBe('first-token');
    expect(auth.sessionUnavailable()).toBe(true);
    expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
  });
  it('renews one minute before expiration', () => {
    vi.useFakeTimers();
    const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 120 }))}.signature`;
    login(token);
    vi.advanceTimersByTime(61000);
    http.expectOne(endpoint).flush({ accessToken: 'renewed-token' });
    expect(auth.accessToken()).toBe('renewed-token');
  });
  it('waits for pending rotation before logout and prevents a late token from restoring the session', () => {
    login();
    auth.refresh().subscribe({ error: () => {} });
    auth.logout().subscribe();
    http.expectNone(`${environment.apiUrl}/users/auth/logout`);
    http.expectOne(endpoint).flush({ accessToken: 'late-token' });
    const logout = http.expectOne(`${environment.apiUrl}/users/auth/logout`);
    expect(logout.request.withCredentials).toBe(true);
    logout.flush(null);
    expect(auth.accessToken()).toBeNull();
  });
  it('does not renew or log out for an incorrect current password', () => {
    login();
    auth.changePassword('incorrect', 'AnotherPassword1').subscribe({ error: () => {} });
    http
      .expectOne(`${environment.apiUrl}/users/me/change-password`)
      .flush({ errorCode: 'INVALID_CREDENTIALS' }, { status: 401, statusText: 'Unauthorized' });
    http.expectNone(endpoint);
    expect(auth.accessToken()).toBe('first-token');
  });
  it('leaves the protected page when proactive renewal finds an expired refresh token', () => {
    login();
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue('/ong');
    auth.refresh().subscribe({ error: () => {} });
    http.expectOne(endpoint).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.accessToken()).toBeNull();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { expired: '1' },
    });
  });
});
