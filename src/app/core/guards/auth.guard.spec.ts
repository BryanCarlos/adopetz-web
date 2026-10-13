import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  provideRouter,
  UrlTree,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom, isObservable } from 'rxjs';
import { authGuard } from './auth.guard';
import { API_URL } from '../config/api';

describe('ONG access', () => {
  it('recovers a session before allowing a protected route', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(isObservable(result)).toBe(true);
    const promise = firstValueFrom(result as import('rxjs').Observable<boolean | UrlTree>);
    TestBed.inject(HttpTestingController)
      .expectOne(`${API_URL}/users/auth/refresh-token`)
      .flush({ accessToken: 'memory-token' });
    expect(await promise).toBe(true);
  });
  it('redirects an expired refresh session to login', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    const promise = firstValueFrom(result as import('rxjs').Observable<boolean | UrlTree>);
    TestBed.inject(HttpTestingController)
      .expectOne(`${API_URL}/users/auth/refresh-token`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect((await promise).toString()).toBe('/login');
  });
});
