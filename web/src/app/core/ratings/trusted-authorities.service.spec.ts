import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CIRCOM_FIELD_SIZE } from '../../utils/circom-field.util';
import { TRUSTED_AUTHORITY_BASE_URLS } from '../config/api.config';
import { RatingSharePayloads, RatingSummary } from './ratings.models';
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

    requests[0].flush({ id: 1 });
    requests[1].flush({ id: 2 });
    expect(responseCount).toBe(0);

    requests[2].flush({ id: 3 });
    expect(responseCount).toBe(3);
  });

  it('reconstructs only the total from three aggregate shares modulo the field', () => {
    let summary: RatingSummary | undefined;
    service.getRatingSummary(6, 5).subscribe((value) => {
      summary = value;
    });

    const requests = TRUSTED_AUTHORITY_BASE_URLS.map((baseUrl) =>
      httpMock.expectOne(`${baseUrl}/shares?roundId=6&targetId=5`),
    );

    requests.forEach((request) => expect(request.request.method).toBe('GET'));

    requests[0].flush({ aggregateShare: (CIRCOM_FIELD_SIZE - 1n).toString(), count: 2 });
    requests[1].flush({ aggregateShare: (CIRCOM_FIELD_SIZE - 1n).toString(), count: 2 });
    expect(summary).toBeUndefined();

    requests[2].flush({ aggregateShare: '11', count: 2 });

    expect(summary).toEqual({ average: 4.5, count: 2 });
  });

  it('returns an empty summary when the user has no ratings in the round', () => {
    let summary: RatingSummary | undefined;
    service.getRatingSummary(6, 5).subscribe((value) => {
      summary = value;
    });

    TRUSTED_AUTHORITY_BASE_URLS.map((baseUrl) =>
      httpMock.expectOne(`${baseUrl}/shares?roundId=6&targetId=5`),
    ).forEach((request) => request.flush({ aggregateShare: '0', count: 0 }));

    expect(summary).toEqual({ average: null, count: 0 });
  });

  it('retains precision for a total larger than the safe integer range', () => {
    const count = Number.MAX_SAFE_INTEGER;
    let summary: RatingSummary | undefined;
    service.getRatingSummary(6, 5).subscribe((value) => {
      summary = value;
    });

    const requests = summaryRequests();
    requests[0].flush({ aggregateShare: (5n * BigInt(count)).toString(), count });
    requests[1].flush({ aggregateShare: '0', count });
    requests[2].flush({ aggregateShare: '0', count });

    expect(summary).toEqual({ average: 5, count });
  });

  it('rejects inconsistent counts instead of showing a partial average', () => {
    const onError = jasmine.createSpy('onError');
    service.getRatingSummary(6, 5).subscribe({ next: () => fail('Unexpected summary'), error: onError });

    const requests = summaryRequests();
    requests[0].flush({ aggregateShare: '1', count: 2 });
    requests[1].flush({ aggregateShare: '1', count: 1 });
    requests[2].flush({ aggregateShare: '3', count: 2 });

    expect(onError).toHaveBeenCalledOnceWith(
      new Error('Trusted authorities returned inconsistent rating counts.'),
    );
  });

  for (const count of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, '2', null]) {
    it(`rejects the invalid rating count ${JSON.stringify(count)}`, () => {
      const onError = jasmine.createSpy('onError');
      service.getRatingSummary(6, 5).subscribe({ next: () => fail('Unexpected summary'), error: onError });

      summaryRequests().forEach((request) => request.flush({ aggregateShare: '0', count }));

      expect(onError).toHaveBeenCalledOnceWith(
        new Error('Trusted authorities returned inconsistent rating counts.'),
      );
    });
  }

  for (const aggregateShare of ['-1', '1.5', '1e2', '0x10', '', ' 1', CIRCOM_FIELD_SIZE.toString(), 1, null]) {
    it(`rejects the invalid aggregate share ${JSON.stringify(aggregateShare)}`, () => {
      const onError = jasmine.createSpy('onError');
      service.getRatingSummary(6, 5).subscribe({ next: () => fail('Unexpected summary'), error: onError });

      const requests = summaryRequests();
      requests[0].flush({ aggregateShare, count: 2 });
      requests[1].flush({ aggregateShare: '1', count: 2 });
      requests[2].flush({ aggregateShare: '3', count: 2 });

      expect(onError).toHaveBeenCalledOnceWith(
        new Error('Trusted authority returned an invalid aggregate share.'),
      );
    });
  }

  it('rejects nonzero aggregate shares for an empty dataset even if they sum to zero', () => {
    const onError = jasmine.createSpy('onError');
    service.getRatingSummary(6, 5).subscribe({ next: () => fail('Unexpected summary'), error: onError });

    const requests = summaryRequests();
    requests[0].flush({ aggregateShare: (CIRCOM_FIELD_SIZE - 1n).toString(), count: 0 });
    requests[1].flush({ aggregateShare: '1', count: 0 });
    requests[2].flush({ aggregateShare: '0', count: 0 });

    expect(onError).toHaveBeenCalledOnceWith(
      new Error('Trusted authority returned an invalid aggregate share.'),
    );
  });

  for (const total of ['1', '11']) {
    it(`rejects an aggregate total of ${total} for two ratings on the 1–5 scale`, () => {
      const onError = jasmine.createSpy('onError');
      service.getRatingSummary(6, 5).subscribe({ next: () => fail('Unexpected summary'), error: onError });

      const requests = summaryRequests();
      requests[0].flush({ aggregateShare: total, count: 2 });
      requests[1].flush({ aggregateShare: '0', count: 2 });
      requests[2].flush({ aggregateShare: '0', count: 2 });

      expect(onError).toHaveBeenCalledOnceWith(
        new Error('Trusted authorities returned an invalid aggregate rating sum.'),
      );
    });
  }

  it('rejects the legacy individual-share response', () => {
    const onError = jasmine.createSpy('onError');
    service.getRatingSummary(6, 5).subscribe({ next: () => fail('Unexpected summary'), error: onError });

    summaryRequests().forEach((request) =>
      request.flush([{ id: 1, ratingId: 101, share: '1', targetId: 5, roundId: 6 }]),
    );

    expect(onError).toHaveBeenCalledOnceWith(
      new Error('Trusted authorities returned inconsistent rating counts.'),
    );
  });

  it('fails when an authority is unavailable instead of reconstructing from two shares', () => {
    const onError = jasmine.createSpy('onError');
    service.getRatingSummary(6, 5).subscribe({ next: () => fail('Unexpected summary'), error: onError });

    const requests = summaryRequests();
    requests[0].flush({ aggregateShare: '1', count: 2 });
    requests[1].flush({ aggregateShare: '1', count: 2 });
    requests[2].flush({}, { status: 503, statusText: 'Service Unavailable' });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.calls.mostRecent().args[0].status).toBe(503);
  });

  function summaryRequests() {
    return TRUSTED_AUTHORITY_BASE_URLS.map((baseUrl) =>
      httpMock.expectOne(`${baseUrl}/shares?roundId=6&targetId=5`),
    );
  }
});
