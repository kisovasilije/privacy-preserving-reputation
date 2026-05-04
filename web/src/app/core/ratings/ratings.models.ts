export interface SubmitRatingRequest {
  value: number;
  commitment: string;
  comment?: string;
  roundId: number;
  targetId: number;
}
