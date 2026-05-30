import { NextFunction, Request, Response } from 'express';
import { RatingCreation } from '../models/rating/rating-creating.model';
import { groth16 } from 'snarkjs';
import { VerificationKeyService as VerificationKey } from '../../../common/zk/verification-key.service';

export async function verifyProof(req: Request<{}, {}, RatingCreation>, res: Response, next: NextFunction) {
  const { proof, publicSignals } = req.body;

  const verificationKey = await VerificationKey.getKey();
  const ok = await groth16.verify(verificationKey, publicSignals, proof);
  if (!ok) {
    return res.status(422).json({ message: 'Invalid proof' });
  }

  next();
}
