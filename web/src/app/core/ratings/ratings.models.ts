export interface SubmitRatingRequest {
  value: number;
  roundId: number;
  targetId: number;
  comment?: string;
  keepRaterIdAnonymous: boolean;
  keepTargetIdAnonymous: boolean;
  keepRoundIdAnonymous: boolean;
}

export interface SubmitRatingResponse {
  id: number;
}

export interface RatingSummary {
  average: number | null;
  count: number;
}
