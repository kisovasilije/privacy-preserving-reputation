import { RatingController } from './controllers/rating.controller';
import { AggregatesRepository } from './repositories/aggregates.repository';
import { RatingRepository } from './repositories/rating.repository';
import { AggregatesService } from './services/aggregates.service';
import { RatingService } from './services/rating.service';

export const ratingStartup = (): RatingController => {
  const repository = new RatingRepository();
  const aggregatesRepository = new AggregatesRepository();
  const aggregatesService = new AggregatesService(aggregatesRepository);
  const service = new RatingService(repository, aggregatesService);
  return new RatingController(service);
};
