import { Request, Response } from 'express';
import { RatingCreation } from '../models/rating/rating-creating.model';
import { RatingService } from '../services/rating.service';

export class RatingController {
  constructor(private ratingService: RatingService) {}

  public create = async (req: Request<{}, {}, RatingCreation>, res: Response) => {
    const authenticatedUserId = req.user!.id;
    const ratingCreation: RatingCreation = {
      ...req.body,
      raterId: req.body.raterId === undefined ? undefined : authenticatedUserId,
    };
    const result = await this.ratingService.create(ratingCreation, authenticatedUserId);
    if (!result.success) {
      const error = result.error!;
      return res.status(error.httpStatusCode || 500).json(error.message);
    }

    return res.status(201).json({ id: result.value!.id });
  };
}
