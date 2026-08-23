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
      commitment: 'abc123',
      comment: 'Reliable, clear communication, delivered on time.',
      roundId: 6,
      targetId: 2,
      proof: {
        pi_a: ['1', '2', '1'],
        pi_b: [
          ['3', '4'],
          ['5', '6'],
          ['1', '0'],
        ],
        pi_c: ['7', '8', '1'],
        protocol: 'groth16',
        curve: 'bn128',
      },
      publicSignals: ['5', '6', '2', '9'],
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
});
