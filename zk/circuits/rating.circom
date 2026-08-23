pragma circom 2.1.8;

include "../node_modules/circomlib/circuits/poseidon.circom";

template Rating() {
  /*
    Private inputs:
      - rating: 1, 2, 3, 4, or 5
      - randomness: a random value to prevent preimage attacks
      - shares: three additive shares of the rating
      - shareRandomness: independent randomness for each share commitment
  */
  signal input rating;
  signal input randomness;
  signal input shares[3];
  signal input shareRandomness[3];

  /*
    Public inputs:
      - roundId: the ID of the rating round
      - raterId: the ID of the user providing the rating
      - targetId: the ID of the user being rated
      - commitment: a Poseidon hash of the above values, used as a commitment to the rating
      - shareCommitments: Poseidon commitments to the three additive shares
  */
  signal input roundId;
  signal input raterId;
  signal input targetId;
  signal input commitment;
  signal input shareCommitments[3];

  /*
    Constraints:
      - rating must be between 1 and 5
      - commitment must be the Poseidon hash of (rating, randomness, roundId, raterId, targetId)
      - the three shares must add up to the rating in the Circom field
      - each share commitment must be the Poseidon hash of (share, share randomness)
  */
  signal a;
  signal b;
  signal c;

  a <== (rating - 1) * (rating - 2);
  b <== (rating - 3) * (rating - 4);
  c <== a * b;
  c * (rating - 5) === 0;

  component poseidon = Poseidon(5);
  poseidon.inputs[0] <== rating;
  poseidon.inputs[1] <== randomness;
  poseidon.inputs[2] <== roundId;
  poseidon.inputs[3] <== raterId;
  poseidon.inputs[4] <== targetId;

  poseidon.out === commitment;

  shares[0] + shares[1] + shares[2] === rating;

  component sharePoseidon[3];
  for (var i = 0; i < 3; i++) {
    sharePoseidon[i] = Poseidon(2);
    sharePoseidon[i].inputs[0] <== shares[i];
    sharePoseidon[i].inputs[1] <== shareRandomness[i];
    sharePoseidon[i].out === shareCommitments[i];
  }
}

component main{ public [roundId, raterId, targetId, commitment, shareCommitments] } = Rating();
