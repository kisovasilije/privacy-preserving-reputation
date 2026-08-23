import { RatingController } from '../controllers/rating.controller';
import { RatingRepository } from '../repositories/rating.repository';
import { RatingService } from '../services/rating.service';

const ratingRepository = new RatingRepository();

const ratingService = new RatingService(ratingRepository);

const ratingController = new RatingController(ratingService);

export { ratingController };
