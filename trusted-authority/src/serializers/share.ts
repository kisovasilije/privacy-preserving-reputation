import type { Share } from "../generated/prisma/client.js";

export interface ShareResponse {
  id: number;
  ratingId: number;
  share: string;
  targetId: number;
  roundId: number;
}

export function serializeShare(row: Share): ShareResponse {
  return {
    id: row.id,
    ratingId: row.ratingId,
    share: row.share.toFixed(0),
    targetId: row.targetId,
    roundId: row.roundId,
  };
}
