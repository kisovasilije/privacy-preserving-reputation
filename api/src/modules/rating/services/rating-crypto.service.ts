import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildPoseidon, type Poseidon } from 'circomlibjs';
import { groth16, type CircuitSignals, type Groth16Proof, type PublicSignals } from 'snarkjs';
import { CIRCOM_FIELD_SIZE, toCircomField, type RatingShares } from '../../../common/zk/circom-field';

const FIELD_ELEMENT_BYTES = 32;
const PROOF_RANDOMNESS_BYTES = 16;

export interface GenerateRatingProofRequest {
  readonly rating: number;
  readonly roundId: number;
  readonly raterId: number;
  readonly targetId: number;
}

export interface GeneratedRatingProof {
  readonly proof: Groth16Proof;
  readonly publicSignals: PublicSignals;
  readonly shares: RatingShares;
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  let value = 0n;

  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }

  return value;
}

function generateProofRandomness(): string {
  while (true) {
    const value = bytesToBigInt(randomBytes(PROOF_RANDOMNESS_BYTES));
    if (value !== 0n) {
      return value.toString();
    }
  }
}

/** Samples uniformly from the BN254 scalar field without modulo bias. */
function randomFieldElement(): bigint {
  while (true) {
    const bytes = randomBytes(FIELD_ELEMENT_BYTES);
    // The scalar modulus is 254 bits, so discard the top two random bits.
    bytes[0] &= 0x3f;
    const candidate = bytesToBigInt(bytes);

    if (candidate < CIRCOM_FIELD_SIZE) {
      return candidate;
    }
  }
}

function splitRating(rating: bigint): RatingShares {
  if (rating < 0n || rating >= CIRCOM_FIELD_SIZE) {
    throw new Error('rating must be a canonical BN254 field element');
  }

  const first = randomFieldElement();
  const second = randomFieldElement();
  const third = toCircomField(rating - first - second);
  return [first, second, third];
}

function toFieldDecimal(value: number, name: string): string {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${name} must be a safe integer`);
  }

  const fieldValue = BigInt(value);
  if (fieldValue < 0n || fieldValue >= CIRCOM_FIELD_SIZE) {
    throw new Error(`${name} must satisfy 0 <= value < FIELD_SIZE`);
  }

  return fieldValue.toString();
}

export class RatingCryptoService {
  private readonly wasmPath: string;
  private readonly zkeyPath: string;
  private readonly verificationKeyPath: string;
  private poseidonPromise?: Promise<Poseidon>;
  private verificationKeyPromise?: Promise<unknown>;

  public constructor(artifactsDirectory: string) {
    this.wasmPath = path.join(artifactsDirectory, 'rating.wasm');
    this.zkeyPath = path.join(artifactsDirectory, 'rating_final.zkey');
    this.verificationKeyPath = path.join(artifactsDirectory, 'verification_key.json');
  }

  public async generateProof(request: GenerateRatingProofRequest): Promise<GeneratedRatingProof> {
    if (!Number.isInteger(request.rating) || request.rating < 1 || request.rating > 5) {
      throw new Error('rating must be an integer between 1 and 5');
    }

    const rating = request.rating.toString();
    const roundId = toFieldDecimal(request.roundId, 'roundId');
    const raterId = toFieldDecimal(request.raterId, 'raterId');
    const targetId = toFieldDecimal(request.targetId, 'targetId');
    const randomness = generateProofRandomness();
    const shares = splitRating(BigInt(rating));
    const shareRandomness = [generateProofRandomness(), generateProofRandomness(), generateProofRandomness()];
    const commitment = await this.commit([
      BigInt(rating),
      BigInt(randomness),
      BigInt(roundId),
      BigInt(raterId),
      BigInt(targetId),
    ]);
    const shareCommitments = await Promise.all([
      this.commit([shares[0], BigInt(shareRandomness[0])]),
      this.commit([shares[1], BigInt(shareRandomness[1])]),
      this.commit([shares[2], BigInt(shareRandomness[2])]),
    ]);

    const circuitInput: CircuitSignals = {
      rating,
      randomness,
      shares: shares.map(share => share.toString()),
      shareRandomness,
      roundId,
      raterId,
      targetId,
      commitment,
      shareCommitments,
    };
    const { proof, publicSignals } = await groth16.fullProve(circuitInput, this.wasmPath, this.zkeyPath);
    const expectedPublicSignals = [commitment, ...shareCommitments];

    if (
      publicSignals.length !== expectedPublicSignals.length ||
      publicSignals.some((signal, index) => signal !== expectedPublicSignals[index])
    ) {
      throw new Error('Generated proof contains unexpected public signals');
    }

    const verificationKey = await this.getVerificationKey();
    const isValid = await groth16.verify(verificationKey, publicSignals, proof);
    if (!isValid) {
      throw new Error('Generated proof failed self-verification');
    }

    return { proof, publicSignals, shares };
  }

  private async commit(payload: bigint[]): Promise<string> {
    const poseidon = await this.getPoseidon();
    return poseidon.F.toString(poseidon(payload));
  }

  private getPoseidon(): Promise<Poseidon> {
    this.poseidonPromise ??= buildPoseidon();
    return this.poseidonPromise;
  }

  private getVerificationKey(): Promise<unknown> {
    this.verificationKeyPromise ??= readFile(this.verificationKeyPath, 'utf8').then(raw => JSON.parse(raw));
    return this.verificationKeyPromise;
  }
}
