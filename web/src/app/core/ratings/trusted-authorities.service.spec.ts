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

  it('reconstructs ratings by ratingId and returns their average and count', () => {
    let summary: { average: number | null; count: number } | undefined;
    service.getRatingSummary(6, 5).subscribe((value) => {
      summary = value;
    });

    const requests = TRUSTED_AUTHORITY_BASE_URLS.map((baseUrl) =>
      httpMock.expectOne(`${baseUrl}/shares?roundId=6&targetId=5`),
    );

    requests.forEach((request) => expect(request.request.method).toBe('GET'));

    requests[0].flush([
      { id: 1, ratingId: 101, share: '1', targetId: 5, roundId: 6 },
      { id: 2, ratingId: 102, share: '2', targetId: 5, roundId: 6 },
    ]);
    requests[1].flush([
      { id: 8, ratingId: 102, share: '2', targetId: 5, roundId: 6 },
      { id: 7, ratingId: 101, share: '1', targetId: 5, roundId: 6 },
    ]);
    expect(summary).toBeUndefined();

    requests[2].flush([
      { id: 20, ratingId: 101, share: '3', targetId: 5, roundId: 6 },
      { id: 21, ratingId: 102, share: '0', targetId: 5, roundId: 6 },
    ]);

    expect(summary).toEqual({ average: 4.5, count: 2 });
  });

  it('returns an empty summary when the user has no ratings in the round', () => {
    let summary: { average: number | null; count: number } | undefined;
    service.getRatingSummary(6, 5).subscribe((value) => {
      summary = value;
    });

    TRUSTED_AUTHORITY_BASE_URLS.map((baseUrl) =>
      httpMock.expectOne(`${baseUrl}/shares?roundId=6&targetId=5`),
    ).forEach((request) => request.flush([]));

    expect(summary).toEqual({ average: null, count: 0 });
  });
});
