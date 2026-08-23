import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map } from 'rxjs';
import { TRUSTED_AUTHORITY_BASE_URLS } from '../config/api.config';
import { reconstructRating } from '../../utils/rating-secret-sharing.util';
import {
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
        this.http.get<RatingShareResponse[]>(`${baseUrl}/shares`, { params }),
      ),
    ).pipe(map((authorityShares) => this.buildSummary(authorityShares, roundId, targetId)));
  }

  private buildSummary(
    authorityShares: readonly RatingShareResponse[][],
    roundId: number,
    targetId: number,
  ): RatingSummary {
    const indexedShares = authorityShares.map((shares) => {
      const byRatingId = new Map<number, RatingShareResponse>();

      for (const share of shares) {
        if (share.roundId !== roundId || share.targetId !== targetId) {
          throw new Error('Trusted authority returned a share for a different summary.');
        }

        if (byRatingId.has(share.ratingId)) {
          throw new Error('Trusted authority returned duplicate shares for a rating.');
        }

        byRatingId.set(share.ratingId, share);
      }

      return byRatingId;
    });

    const ratingIds = [...indexedShares[0].keys()];
    if (
      indexedShares.some(
        (shares) =>
          shares.size !== ratingIds.length || ratingIds.some((ratingId) => !shares.has(ratingId)),
      )
    ) {
      throw new Error('Trusted authorities returned incomplete rating shares.');
    }

    const total = ratingIds.reduce((sum, ratingId) => {
      const rating = reconstructRating([
        BigInt(indexedShares[0].get(ratingId)!.share),
        BigInt(indexedShares[1].get(ratingId)!.share),
        BigInt(indexedShares[2].get(ratingId)!.share),
      ]);

      if (rating < 1n || rating > 5n) {
        throw new Error('Trusted authorities returned an invalid reconstructed rating.');
      }

      return sum + rating;
    }, 0n);

    return {
      average: ratingIds.length ? Number(total) / ratingIds.length : null,
      count: ratingIds.length,
    };
  }
}
