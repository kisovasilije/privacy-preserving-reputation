import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { SubmitRatingRequest } from './ratings.models';

@Injectable({ providedIn: 'root' })
export class RatingsService {
  private readonly http = inject(HttpClient);

  submitRating(request: SubmitRatingRequest) {
    return this.http.post<void>(`${API_BASE_URL}/ratings`, request);
  }
}
