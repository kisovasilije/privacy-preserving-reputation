pragma circom 2.1.8;

include "../node_modules/circomlib/circuits/poseidon.circom";

template Rating() {
  /*
    Private inputs:
      - rating: 1, 2, 3, 4, or 5
      - randomness: a random value to prevent preimage attacks
  */
  signal input rating;
  signal input randomness;

  /*
    Public inputs:
      - roundId: the ID of the rating round
      - raterId: the ID of the user providing the rating
      - targetId: the ID of the user being rated
      - commitment: a Poseidon hash of the above values, used as a commitment to the rating
  */
  signal input roundId;
  signal input raterId;
  signal input targetId;
  signal input commitment;

  /*
    Constraints:
      - rating must be between 1 and 5
      - commitment must be the Poseidon hash of (rating, randomness, roundId, raterId, targetId)
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
}

component main{ public [roundId, raterId, targetId, commitment] } = Rating();