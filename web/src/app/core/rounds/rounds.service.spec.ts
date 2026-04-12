import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../config/api.config';
import { RoundsService } from './rounds.service';

describe('RoundsService', () => {
  let service: RoundsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(RoundsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch opened rounds', () => {
    service.getOpenedRounds().subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/rounds/opened`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('should create a round with the provided payload', () => {
    const payload = {
      title: 'Round one',
      description: 'Private feedback',
      opensAt: '2026-04-12T10:00:00.000Z',
      closesAt: '2026-04-12T12:00:00.000Z',
    };

    service.createRound(payload).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/rounds`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(payload);
  });

  it('should close a round', () => {
    service.closeRound(17).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/rounds/17/close`);
    expect(request.request.method).toBe('PATCH');
    request.flush({});
  });
});
