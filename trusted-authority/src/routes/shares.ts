import { Router } from "express";

import { BN254_SCALAR_FIELD_MODULUS } from "../constants/numeric.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import {
  aggregateSharesQuerySchema,
  createShareSchema,
} from "../validation/share-schemas.js";
import { validate } from "../validation/validate.js";

export function createSharesRouter(prisma: PrismaClient): Router {
  const sharesRouter = Router();

  sharesRouter.post("/", async (request, response) => {
    const input = validate(createShareSchema, request.body, "body");

    const createdShare = await prisma.share.create({
      data: {
        share: input.share.toString(),
        targetId: input.targetId,
        roundId: input.roundId,
      },
      select: { id: true },
    });

    response.status(201).json({ id: createdShare.id });
  });

  sharesRouter.get("/", async (request, response) => {
    const query = validate(aggregateSharesQuerySchema, request.query, "query");

    // Sum and count the same local dataset in one database query.
    const aggregate = await prisma.share.aggregate({
      where: {
        roundId: query.roundId,
        targetId: query.targetId,
      },
      _sum: { share: true },
      _count: true,
    });

    const aggregateShare =
      BigInt(aggregate._sum.share?.toFixed(0) ?? "0") % BN254_SCALAR_FIELD_MODULUS;

    response.status(200).json({
      aggregateShare: aggregateShare.toString(),
      count: aggregate._count,
    });
  });

  return sharesRouter;
}
