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
