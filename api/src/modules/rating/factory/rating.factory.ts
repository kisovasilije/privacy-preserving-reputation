import { environment } from '../../../config/env';
import { RatingController } from '../controllers/rating.controller';
import { RatingRepository } from '../repositories/rating.repository';
import { RatingCryptoService } from '../services/rating-crypto.service';
import { RatingService } from '../services/rating.service';
import { TrustedAuthoritiesClient } from '../services/trusted-authorities.client';

const ratingRepository = new RatingRepository();
const ratingCryptoService = new RatingCryptoService(environment.ZK_ARTIFACTS_DIR);
const trustedAuthoritiesClient = new TrustedAuthoritiesClient(
  environment.TRUSTED_AUTHORITY_URLS,
  environment.TRUSTED_AUTHORITY_TIMEOUT_MS,
);

const ratingService = new RatingService(ratingRepository, ratingCryptoService, trustedAuthoritiesClient);

const ratingController = new RatingController(ratingService);

export { ratingController };
