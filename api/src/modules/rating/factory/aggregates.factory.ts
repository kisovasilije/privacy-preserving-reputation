import { AggregatesRepository } from '../repositories/aggregates.repository';
import { AggregatesService } from '../services/aggregates.service';

const aggregatesRepository = new AggregatesRepository();

const aggregatesService = new AggregatesService(aggregatesRepository);

export { aggregatesService };
