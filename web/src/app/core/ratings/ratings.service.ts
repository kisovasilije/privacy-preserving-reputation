import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { RatingSummary, SubmitRatingRequest, SubmitRatingResponse } from './ratings.models';

@Injectable({ providedIn: 'root' })
export class RatingsService {
  private readonly http = inject(HttpClient);

  submitRating(request: SubmitRatingRequest) {
    return this.http.post<SubmitRatingResponse>(`${API_BASE_URL}/ratings`, request);
  }

  getRatingSummary(roundId: number) {
    const params = new HttpParams().set('roundId', roundId);

    return this.http.get<RatingSummary>(`${API_BASE_URL}/ratings/summary`, { params });
  }
}
