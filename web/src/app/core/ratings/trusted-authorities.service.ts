import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { TRUSTED_AUTHORITY_BASE_URLS } from '../config/api.config';
import {
  RatingSharePayloads,
  RatingShareResponse,
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
}
