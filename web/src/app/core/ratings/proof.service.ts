import { Injectable } from '@angular/core';
import { Poseidon } from 'circomlibjs';
import { groth16 } from 'snarkjs';
import { CIRCOM_FIELD_SIZE } from '../../utils/circom-field.util';

type CommitmentPayload = bigint[]; // [rating, roundId, targetId, raterId, randomness]

interface GenerateProofRequest {
  rating: number;
  roundId: number;
  raterId: number;
  targetId: number;
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  let result = 0n;

  for (const byte of bytes) {
    result = (result << 8n) + BigInt(byte);
  }

  return result;
}

function generateRandomnessDecimal(): string {
  while (true) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    const x = bytesToBigInt(bytes);
    if (x !== 0n) {
      return x.toString();
    }
  }
}

function toFieldDecimal(value: number, name: string): string {
  const x = BigInt(value);

  if (x < 0n || x >= ProofService.FIELD_SIZE) {
    throw new Error(`${name} must be: 0 <= value < FIELD_SIZE`);
  }

  return x.toString();
}

function normalizeRating(value: number): string {
  const rating = Number(value);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error(`rating must be an integer between 1 and 5`);
  }

  return rating.toString();
}

@Injectable({
  providedIn: 'root',
})
export class ProofService {
  private static readonly ARTIFACTS_BASE_PATH = '/assets/zk';

  public static readonly FIELD_SIZE = CIRCOM_FIELD_SIZE;

  private poseidonPromise?: Promise<Poseidon>;

  constructor() {}

  private async getPoseidon(): Promise<Poseidon> {
    this.poseidonPromise ??= (async () => {
      if (!(globalThis as any).Buffer) {
        const { Buffer } = await import('buffer');
        (globalThis as any).Buffer = Buffer;
      }

      const { buildPoseidon } = await import('circomlibjs');
      return await buildPoseidon();
    })();

    return this.poseidonPromise;
  }

  private async commit(payload: CommitmentPayload): Promise<string> {
    const poseidon = await this.getPoseidon();
    const F = poseidon.F;
    const hash = poseidon(payload);
    return F.toString(hash);
  }

  public async generateProof(request: GenerateProofRequest) {
    const randomness = generateRandomnessDecimal();
    const rating = normalizeRating(request.rating);
    const roundId = toFieldDecimal(request.roundId, 'roundId');
    const raterId = toFieldDecimal(request.raterId, 'raterId');
    const targetId = toFieldDecimal(request.targetId, 'targetId');
    const commitment = await this.commit([
      BigInt(rating),
      BigInt(randomness),
      BigInt(roundId),
      BigInt(raterId),
      BigInt(targetId),
    ]);

    const circuitInput = {
      rating,
      randomness,
      roundId,
      raterId,
      targetId,
      commitment,
    } as const;

    const { proof, publicSignals } = await groth16.fullProve(
      circuitInput,
      `${ProofService.ARTIFACTS_BASE_PATH}/rating.wasm`,
      `${ProofService.ARTIFACTS_BASE_PATH}/rating_final.zkey`,
    );

    return { proof, publicSignals, commitment };
  }
}
