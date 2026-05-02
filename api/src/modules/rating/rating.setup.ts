import { RatingController } from './controllers/rating.controller';
import { ratingController } from './factory/rating.factory';

export const ratingStartup = (): RatingController => {
  return ratingController;
};
