export interface SubmitRatingRequest {
  value: number;
  comment?: string;
  roundId: number;
  targetId: number;
}
