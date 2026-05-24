import {
  commit,
  createCommitmentPayload,
  sha256,
} from './commitment.util';

describe('commitment util', () => {
  it('builds the commitment payload from the rating context and nonce', () => {
    expect(
      createCommitmentPayload(
        {
          rating: 5,
          roundId: 6,
          targetId: 2,
          raterId: 5,
        },
        'nonce-1',
      ),
    ).toBe(
      JSON.stringify({
        rating: 5,
        roundId: 6,
        targetId: 2,
        raterId: 5,
        nonce: 'nonce-1',
      }),
    );
  });

  it('creates a commitment over rating, round, target, rater, and nonce', async () => {
    const message = {
      rating: 5,
      roundId: 6,
      targetId: 2,
      raterId: 5,
    };

    const { commitment, nonce } = await commit(message);
    const expectedPayload = JSON.stringify({ ...message, nonce });

    expect(commitment).toBe(await sha256(expectedPayload));
  });
});
