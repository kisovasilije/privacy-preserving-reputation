import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map } from 'rxjs';
import { TRUSTED_AUTHORITY_BASE_URLS } from '../config/api.config';
import { CIRCOM_FIELD_SIZE, toCircomField } from '../../utils/circom-field.util';
import {
  RatingAggregateResponse,
  RatingSharePayloads,
  RatingShareResponse,
  RatingSummary,
} from './ratings.models';

@Injectable({ providedIn: 'root' })
export class TrustedAuthoritiesService {
  private readonly http = inject(HttpClient);

  submitRatingShares(payloads: RatingSharePayloads) {
    return forkJoin(
      TRUSTED_AUTHORITY_BASE_URLS.map((baseUrl, index) =>
        this.http.post<RatingShareResponse>(`${baseUrl}/shares`, payloads[index]),
      ),
    );
  }

  getRatingSummary(roundId: number, targetId: number) {
    const params = new HttpParams().set('roundId', roundId).set('targetId', targetId);

    return forkJoin(
      TRUSTED_AUTHORITY_BASE_URLS.map((baseUrl) =>
        this.http.get<RatingAggregateResponse>(`${baseUrl}/shares`, { params }),
      ),
    ).pipe(map((aggregates) => this.buildSummary(aggregates)));
  }

  private buildSummary(aggregates: readonly RatingAggregateResponse[]): RatingSummary {
    const count = aggregates[0]?.count;
    if (
      !Number.isSafeInteger(count) ||
      count < 0 ||
      aggregates.some((aggregate) => aggregate?.count !== count)
    ) {
      throw new Error('Trusted authorities returned inconsistent rating counts.');
    }

    const totalRatingSum = toCircomField(
      aggregates.reduce((sum, { aggregateShare }) => {
        if (typeof aggregateShare !== 'string' || !/^[0-9]+$/.test(aggregateShare)) {
          throw new Error('Trusted authority returned an invalid aggregate share.');
        }

        const share = BigInt(aggregateShare);
        if (share >= CIRCOM_FIELD_SIZE || (count === 0 && share !== 0n)) {
          throw new Error('Trusted authority returned an invalid aggregate share.');
        }

        return sum + share;
      }, 0n),
    );

    const ratingCount = BigInt(count);
    if (totalRatingSum < ratingCount || totalRatingSum > 5n * ratingCount) {
      throw new Error('Trusted authorities returned an invalid aggregate rating sum.');
    }

    return {
      // Divide before converting to numbers so even large totals retain precision.
      average: count
        ? Number(totalRatingSum / ratingCount) + Number(totalRatingSum % ratingCount) / count
        : null,
      count,
    };
  }
}
