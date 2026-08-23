import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TRUSTED_AUTHORITY_BASE_URLS } from '../config/api.config';
import { RatingSharePayloads } from './ratings.models';
import { TrustedAuthoritiesService } from './trusted-authorities.service';

describe('TrustedAuthoritiesService', () => {
  let service: TrustedAuthoritiesService;
  let httpMock: HttpTestingController;

  const payloads: RatingSharePayloads = [
    { ratingId: 42, share: '111', targetId: 2, roundId: 6 },
    { ratingId: 42, share: '222', targetId: 2, roundId: 6 },
    { ratingId: 42, share: '333', targetId: 2, roundId: 6 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TrustedAuthoritiesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends one distinct share to each trusted authority and waits for all responses', () => {
    let responseCount = 0;
    service.submitRatingShares(payloads).subscribe((responses) => {
      responseCount = responses.length;
    });

    const requests = TRUSTED_AUTHORITY_BASE_URLS.map((baseUrl) =>
      httpMock.expectOne(`${baseUrl}/shares`),
    );

    requests.forEach((request, index) => {
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(payloads[index]);
    });

    requests[0].flush({ id: 1, ...payloads[0] });
    requests[1].flush({ id: 2, ...payloads[1] });
    expect(responseCount).toBe(0);

    requests[2].flush({ id: 3, ...payloads[2] });
    expect(responseCount).toBe(3);
  });
});
