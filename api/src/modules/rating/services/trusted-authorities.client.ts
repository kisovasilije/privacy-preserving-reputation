import { z } from 'zod';
import { CIRCOM_FIELD_SIZE, toCircomField, type RatingShares } from '../../../common/zk/circom-field';

const decimalStringPattern = /^(0|[1-9]\d*)$/;

const createShareResponseSchema = z
  .object({
    id: z.number().int().positive(),
  })
  .strict();

const aggregateResponseSchema = z
  .object({
    aggregateShare: z.string().superRefine((value, context) => {
      if (!decimalStringPattern.test(value)) {
        context.addIssue({ code: 'custom', message: 'Must be an unsigned decimal string' });
        return;
      }

      if (BigInt(value) >= CIRCOM_FIELD_SIZE) {
        context.addIssue({ code: 'custom', message: 'Must be a canonical BN254 field element' });
      }
    }),
    count: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  })
  .strict();

export interface RatingSummary {
  readonly average: number | null;
  readonly count: number;
}

interface RatingSharePayload {
  readonly ratingId: number;
  readonly share: string;
  readonly targetId: number;
  readonly roundId: number;
}

export class TrustedAuthorityClientError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'TrustedAuthorityClientError';
  }
}

export class TrustedAuthoritiesClient {
  public constructor(
    private readonly baseUrls: readonly [string, string, string],
    private readonly timeoutMs: number,
  ) {}

  public async submitRatingShares(
    ratingId: number,
    shares: RatingShares,
    roundId: number,
    targetId: number,
  ): Promise<void> {
    await Promise.all([
      this.submitShare(0, this.baseUrls[0], { ratingId, share: shares[0].toString(), roundId, targetId }),
      this.submitShare(1, this.baseUrls[1], { ratingId, share: shares[1].toString(), roundId, targetId }),
      this.submitShare(2, this.baseUrls[2], { ratingId, share: shares[2].toString(), roundId, targetId }),
    ]);
  }

  public async getRatingSummary(roundId: number, targetId: number): Promise<RatingSummary> {
    const aggregates = await Promise.all([
      this.fetchAggregate(0, this.baseUrls[0], roundId, targetId),
      this.fetchAggregate(1, this.baseUrls[1], roundId, targetId),
      this.fetchAggregate(2, this.baseUrls[2], roundId, targetId),
    ]);

    return this.buildSummary(aggregates);
  }

  private async submitShare(authorityIndex: number, baseUrl: string, payload: RatingSharePayload): Promise<void> {
    const response = await this.request(authorityIndex, this.sharesUrl(baseUrl), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const body = await this.readJson(authorityIndex, response);
    if (!createShareResponseSchema.safeParse(body).success) {
      throw new TrustedAuthorityClientError(
        `Trusted authority ${authorityIndex + 1} returned an invalid share response`,
      );
    }
  }

  private async fetchAggregate(
    authorityIndex: number,
    baseUrl: string,
    roundId: number,
    targetId: number,
  ): Promise<z.infer<typeof aggregateResponseSchema>> {
    const url = new URL(this.sharesUrl(baseUrl));
    url.searchParams.set('roundId', roundId.toString());
    url.searchParams.set('targetId', targetId.toString());

    const response = await this.request(authorityIndex, url, {
      headers: { Accept: 'application/json' },
    });
    const parsed = aggregateResponseSchema.safeParse(await this.readJson(authorityIndex, response));
    if (!parsed.success) {
      throw new TrustedAuthorityClientError(
        `Trusted authority ${authorityIndex + 1} returned an invalid aggregate response`,
      );
    }

    return parsed.data;
  }

  private async request(authorityIndex: number, url: string | URL, init: RequestInit): Promise<Response> {
    let response: Response;

    try {
      response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new TrustedAuthorityClientError(`Trusted authority ${authorityIndex + 1} could not be reached`);
    }

    if (!response.ok) {
      throw new TrustedAuthorityClientError(`Trusted authority ${authorityIndex + 1} returned HTTP ${response.status}`);
    }

    return response;
  }

  private async readJson(authorityIndex: number, response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw new TrustedAuthorityClientError(`Trusted authority ${authorityIndex + 1} returned invalid JSON`);
    }
  }

  private buildSummary(aggregates: readonly z.infer<typeof aggregateResponseSchema>[]): RatingSummary {
    const count = aggregates[0]?.count;
    if (!Number.isSafeInteger(count) || count < 0 || aggregates.some(aggregate => aggregate.count !== count)) {
      throw new TrustedAuthorityClientError('Trusted authorities returned inconsistent rating counts');
    }

    const totalRatingSum = toCircomField(
      aggregates.reduce((sum, aggregate) => {
        const share = BigInt(aggregate.aggregateShare);
        if (count === 0 && share !== 0n) {
          throw new TrustedAuthorityClientError(
            'Trusted authorities returned a nonzero aggregate for an empty rating set',
          );
        }

        return sum + share;
      }, 0n),
    );
    const ratingCount = BigInt(count);
    if (totalRatingSum < ratingCount || totalRatingSum > 5n * ratingCount) {
      throw new TrustedAuthorityClientError('Trusted authorities returned an invalid aggregate rating sum');
    }

    return {
      average: count ? Number(totalRatingSum / ratingCount) + Number(totalRatingSum % ratingCount) / count : null,
      count,
    };
  }

  private sharesUrl(baseUrl: string): string {
    return `${baseUrl.replace(/\/+$/, '')}/shares`;
  }
}
