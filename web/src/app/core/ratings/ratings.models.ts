import { Groth16Proof, PublicSignals } from 'snarkjs';

export interface SubmitRatingRequest {
  value: number;
  commitment: string;
  comment?: string;
  roundId: number;
  targetId: number;
  proof: Groth16Proof;
  publicSignals: PublicSignals;
}

export interface SubmitRatingResponse {
  id: number;
}

export interface RatingSharePayload {
  ratingId: number;
  share: string;
  targetId: number;
  roundId: number;
}

export type RatingSharePayloads = readonly [
  RatingSharePayload,
  RatingSharePayload,
  RatingSharePayload,
];

export interface RatingShareResponse extends RatingSharePayload {
  id: number;
}

export interface RatingSummary {
  average: number | null;
  count: number;
}
