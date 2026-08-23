declare module '@rating-crypto/poseidon' {
  import type { Poseidon } from 'circomlibjs';

  export function buildPoseidon(): Promise<Poseidon>;
}
