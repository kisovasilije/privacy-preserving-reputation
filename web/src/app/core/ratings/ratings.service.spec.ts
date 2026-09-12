import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../config/api.config';
import { RatingsService } from './ratings.service';

describe('RatingsService', () => {
  let service: RatingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(RatingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should submit a rating with the provided payload', () => {
    const payload = {
      value: 5,
      roundId: 6,
      targetId: 2,
      comment: 'Reliable, clear communication, delivered on time.',
      keepRaterIdAnonymous: true,
      keepTargetIdAnonymous: false,
      keepRoundIdAnonymous: false,
    };

    let response: unknown;
    service.submitRating(payload).subscribe((value) => {
      response = value;
    });

    const request = httpMock.expectOne(`${API_BASE_URL}/ratings`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ id: 42 });
    expect(response).toEqual({ id: 42 });
  });

  it('should load the authenticated user summary for a round', () => {
    let response: unknown;
    service.getRatingSummary(6).subscribe((value) => {
      response = value;
    });

    const request = httpMock.expectOne(`${API_BASE_URL}/ratings/summary?roundId=6`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('targetId')).toBeFalse();
    request.flush({ average: 4.5, count: 2 });
    expect(response).toEqual({ average: 4.5, count: 2 });
  });
});
