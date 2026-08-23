import { Router } from "express";

import type { PrismaClient } from "../generated/prisma/client.js";
import { serializeShare } from "../serializers/share.js";
import {
  createShareSchema,
  findSharesQuerySchema,
} from "../validation/share-schemas.js";
import { validate } from "../validation/validate.js";

export function createSharesRouter(prisma: PrismaClient): Router {
  const sharesRouter = Router();

  sharesRouter.post("/", async (request, response) => {
    const input = validate(createShareSchema, request.body, "body");

    const createdShare = await prisma.share.create({
      data: {
        ratingId: input.ratingId,
        share: input.share.toString(),
        targetId: input.targetId,
        roundId: input.roundId,
      },
    });

    response.status(201).json(serializeShare(createdShare));
  });

  sharesRouter.get("/", async (request, response) => {
    const query = validate(findSharesQuerySchema, request.query, "query");

    const matchingShares = await prisma.share.findMany({
      where: {
        roundId: query.roundId,
        targetId: query.targetId,
      },
      orderBy: {
        id: "asc",
      },
    });

    response.status(200).json(matchingShares.map(serializeShare));
  });

  return sharesRouter;
}
