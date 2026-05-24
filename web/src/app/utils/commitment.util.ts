export const sha256 = async (message: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const generateNonce = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export interface CommitmentMessage {
  rating: number;
  roundId: number;
  targetId: number;
  raterId: number;
}

export const createCommitmentPayload = (
  { rating, roundId, targetId, raterId }: CommitmentMessage,
  nonce: string,
): string => JSON.stringify({ rating, roundId, targetId, raterId, nonce });

export const commit = async (message: CommitmentMessage) => {
  const nonce = generateNonce();

  const payload = createCommitmentPayload(message, nonce);
  const commitment = await sha256(payload);

  return { commitment, nonce };
};
