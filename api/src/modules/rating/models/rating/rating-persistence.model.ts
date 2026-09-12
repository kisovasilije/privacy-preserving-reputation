import type { Groth16Proof, PublicSignals } from 'snarkjs';

export interface RatingPersistence {
  readonly commitment: string;
  readonly comment?: string;
  readonly proof: Groth16Proof;
  readonly publicSignals: PublicSignals;
  readonly raterId: number | null;
  readonly roundId: number | null;
  readonly targetId: number | null;
}
