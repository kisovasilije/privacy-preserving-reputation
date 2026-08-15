/** Scalar field modulus used by Circom circuits over the BN254 curve. */
// prettier-ignore
export const CIRCOM_FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/** Returns the canonical representative of `value` in the Circom field. */
export function toCircomField(value: bigint): bigint {
  const remainder = value % CIRCOM_FIELD_SIZE;
  return remainder >= 0n ? remainder : remainder + CIRCOM_FIELD_SIZE;
}
