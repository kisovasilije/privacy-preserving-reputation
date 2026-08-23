import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { API_BASE_URL, TRUSTED_AUTHORITY_BASE_URLS } from '../config/api.config';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from './auth.store';

describe('authInterceptor', () => {
  const next = jasmine.createSpy('next').and.returnValue(of(new HttpResponse()));

  beforeEach(() => {
    next.calls.reset();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthStore,
          useValue: { accessToken: () => 'main-api-token' },
        },
      ],
    });
  });

  it('adds the access token to main API requests', () => {
    const request = new HttpRequest('GET', `${API_BASE_URL}/rounds/opened`);

    TestBed.runInInjectionContext(() => authInterceptor(request, next)).subscribe();

    expect(next.calls.mostRecent().args[0].headers.get('Authorization')).toBe(
      'Bearer main-api-token',
    );
  });

  it('does not disclose the access token to trusted authorities', () => {
    const request = new HttpRequest('POST', `${TRUSTED_AUTHORITY_BASE_URLS[0]}/shares`, {});

    TestBed.runInInjectionContext(() => authInterceptor(request, next)).subscribe();

    expect(next.calls.mostRecent().args[0].headers.has('Authorization')).toBeFalse();
  });
});
