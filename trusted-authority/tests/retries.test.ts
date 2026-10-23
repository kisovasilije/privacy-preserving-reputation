import assert from "node:assert/strict";
import { once } from "node:events";
import { test, type TestContext } from "node:test";

import { createApp } from "../src/app.js";
import { BN254_SCALAR_FIELD_MODULUS as P } from "../src/constants/numeric.js";
import { Prisma, type PrismaClient } from "../src/generated/prisma/client.js";

// Characterization of the merged append-only store, not a deduplication mock.
// These passing tests document the vulnerability; change their expectations when fixed.
async function authority(context: TestContext) {
  const rows: { ratingId: number; roundId: number; targetId: number; share: string }[] = [];
  const prisma = {
    share: {
      async create({ data }: { data: (typeof rows)[number] }) {
        rows.push({ ...data });
        return { id: rows.length };
      },
      async aggregate({ where }: { where: { roundId: number; targetId: number } }) {
        const matching = rows.filter(r => r.roundId === where.roundId && r.targetId === where.targetId);
        return {
          _sum: { share: new Prisma.Decimal(matching.reduce((sum, r) => sum + BigInt(r.share), 0n).toString()) },
          _count: matching.length,
        };
      },
    },
  } as unknown as PrismaClient;
  const server = createApp(prisma).listen(0, "127.0.0.1");
  context.after(async () => {
    const closed = once(server, "close");
    server.close();
    server.closeAllConnections();
    await closed;
  });
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/shares`;
  return {
    async post(share: string, ratingId = 101, roundId = 6, targetId = 5) {
      const response = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratingId, roundId, targetId, share }),
      });
      assert.equal(response.status, 201);
      const body = await response.json();
      assert.deepEqual(Object.keys(body), ["id"]);
      return body.id as number;
    },
    async summary() {
      const response = await fetch(`${url}?roundId=6&targetId=5`);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.deepEqual(Object.keys(body).sort(), ["aggregateShare", "count"]);
      return body as { aggregateShare: string; count: number };
    },
  };
}

test("sequential retry after a lost acknowledgement adds another row and wraps the local sum", async context => {
  const ta = await authority(context);
  const firstId = await ta.post((P - 1n).toString()); // pretend the caller lost this ack
  assert.deepEqual(await ta.summary(), { aggregateShare: (P - 1n).toString(), count: 1 });
  assert.notEqual(await ta.post((P - 1n).toString()), firstId);
  assert.deepEqual(await ta.summary(), { aggregateShare: (P - 2n).toString(), count: 2 });
});

test("concurrent duplicate delivery counts twice; other targets and rounds stay excluded", async context => {
  const ta = await authority(context);
  const ids = await Promise.all([ta.post("3"), ta.post("3")]);
  assert.equal(new Set(ids).size, 2);
  await ta.post("99", 102, 7, 5);
  await ta.post("99", 103, 6, 8);
  assert.deepEqual(await ta.summary(), { aggregateShare: "6", count: 2 });
});

test("retrying a partially delivered submission to all three leaves unequal counts", async context => {
  const tas = await Promise.all([authority(context), authority(context), authority(context)]);
  await tas[0]!.post("1"); // TA2/TA3 were unavailable before accepting a write
  await Promise.all(tas.map((ta, i) => ta.post(["1", "1", "3"][i]!)));
  assert.deepEqual((await Promise.all(tas.map(ta => ta.summary()))).map(s => s.count), [2, 1, 1]);
});

test("replay to all authorities silently doubles count while preserving a valid average", async context => {
  const tas = await Promise.all([authority(context), authority(context), authority(context)]);
  for (let delivery = 0; delivery < 2; delivery++) {
    await Promise.all(tas.map((ta, i) => ta.post(["1", "1", "3"][i]!)));
  }
  const summaries = await Promise.all(tas.map(ta => ta.summary()));
  assert.deepEqual(summaries.map(s => s.count), [2, 2, 2]);
  const total = summaries.reduce((sum, s) => sum + BigInt(s.aggregateShare), 0n) % P;
  assert.equal(total, 10n);
  assert.equal(Number(total) / summaries[0]!.count, 5);
});
