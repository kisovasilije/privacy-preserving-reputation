import { RatingController } from '../controllers/rating.controller';
import { RatingRepository } from '../repositories/rating.repository';
import { RatingService } from '../services/rating.service';
import { aggregatesService } from './aggregates.factory';

const ratingRepository = new RatingRepository();

const ratingService = new RatingService(ratingRepository, aggregatesService);

const ratingController = new RatingController(ratingService);

export { ratingController };
