import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { CreateRoundRequest, OpenedRound } from './rounds.models';

@Injectable({ providedIn: 'root' })
export class RoundsService {
  private readonly http = inject(HttpClient);

  getOpenedRounds() {
    return this.http.get<OpenedRound[]>(`${API_BASE_URL}/rounds/opened`);
  }

  createRound(request: CreateRoundRequest) {
    return this.http.post<OpenedRound>(`${API_BASE_URL}/rounds`, request);
  }

  closeRound(roundId: number) {
    return this.http.patch<OpenedRound>(`${API_BASE_URL}/rounds/${roundId}/close`, null);
  }
}
