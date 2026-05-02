import { RatingController } from './controllers/rating.controller';
import { RatingRepository } from './repositories/rating.repository';
import { RatingService } from './services/rating.service';

export const ratingStartup = (): RatingController => {
  const repository = new RatingRepository();
  const service = new RatingService(repository);
  return new RatingController(service);
};
