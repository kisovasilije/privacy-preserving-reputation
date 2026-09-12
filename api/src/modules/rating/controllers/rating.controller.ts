import { Request, Response } from 'express';
import { CreateRatingRequest, RatingSummaryQuery } from '../schemas/rating.schema';
import { RatingService } from '../services/rating.service';
import { TrustedAuthorityClientError } from '../services/trusted-authorities.client';

export class RatingController {
  constructor(private ratingService: RatingService) {}

  public create = async (req: Request, res: Response, request: CreateRatingRequest): Promise<Response> => {
    try {
      const result = await this.ratingService.create(request, req.user!.id);
      if (!result.success) {
        const error = result.error!;
        return res.status(error.httpStatusCode || 500).json({ message: error.message });
      }

      return res.status(201).json({ id: result.value!.id });
    } catch (error) {
      const isAuthorityFailure = error instanceof TrustedAuthorityClientError;
      return res.status(isAuthorityFailure ? 502 : 500).json({
        message: isAuthorityFailure
          ? 'A trusted authority could not complete the rating submission'
          : 'Rating proof generation or persistence failed',
      });
    }
  };

  public getSummary = async (req: Request<{}, {}, {}, RatingSummaryQuery>, res: Response) => {
    try {
      const summary = await this.ratingService.getSummary(Number(req.query.roundId), req.user!.id);
      return res.status(200).json(summary);
    } catch (error) {
      const isAuthorityFailure = error instanceof TrustedAuthorityClientError;
      return res.status(isAuthorityFailure ? 502 : 500).json({
        message: isAuthorityFailure
          ? 'Trusted authorities could not provide a rating summary'
          : 'Failed to load the rating summary',
      });
    }
  };
}
