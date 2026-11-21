import assert from "node:assert/strict";
import { once } from "node:events";
import { mock, test, type TestContext } from "node:test";

import { createApp } from "../src/app.js";
import { BN254_SCALAR_FIELD_MODULUS as FIELD_MODULUS } from "../src/constants/numeric.js";
import { Prisma, type PrismaClient } from "../src/generated/prisma/client.js";

async function createFixture(context: TestContext, sum: bigint | null = null, count = 0) {
  const aggregate = mock.fn(async (_query: unknown) => ({
    _sum: { share: sum === null ? null : new Prisma.Decimal(sum.toString()) },
    _count: count,
  }));
  const create = mock.fn(async (_query: unknown) => ({ id: 12 }));
  // Only aggregate/create are available: a route that retrieves rows will fail.
  const prisma = { share: { aggregate, create } } as unknown as PrismaClient;
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

  return { url: `http://127.0.0.1:${address.port}/shares`, aggregate, create };
}

test("GET returns only the local aggregate modulo the field and the matching count", async (context) => {
  const { url, aggregate } = await createFixture(context, 3n * FIELD_MODULUS + 17n, 5);
  const response = await fetch(`${url}?roundId=6&targetId=5`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { aggregateShare: "17", count: 5 });
  assert.equal(aggregate.mock.callCount(), 1);
  assert.deepEqual(aggregate.mock.calls[0]?.arguments[0], {
    where: { roundId: 6, targetId: 5 },
    _sum: { share: true },
    _count: true,
  });
});

test("GET preserves the full precision of a large aggregate field element", async (context) => {
  const { url } = await createFixture(context, 2n * FIELD_MODULUS - 1n, 3);
  const response = await fetch(`${url}?roundId=6&targetId=5`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    aggregateShare: (FIELD_MODULUS - 1n).toString(),
    count: 3,
  });
});

test("GET returns a zero aggregate and count when there are no matches", async (context) => {
  const { url } = await createFixture(context);
  const response = await fetch(`${url}?roundId=6&targetId=5`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { aggregateShare: "0", count: 0 });
});

test("GET preserves the count when a nonempty local sum wraps to zero", async (context) => {
  const { url } = await createFixture(context, FIELD_MODULUS, 2);
  const response = await fetch(`${url}?roundId=6&targetId=5`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { aggregateShare: "0", count: 2 });
});

test("GET requires one round and target and rejects rating-level filters", async (context) => {
  const { url, aggregate } = await createFixture(context);

  for (const query of [
    "",
    "roundId=6",
    "targetId=5",
    "roundId=6&roundId=7&targetId=5",
    "roundId=6&targetId=5&targetId=4",
    "roundId=0&targetId=5",
    "roundId=6&targetId=5&ratingId=101",
  ]) {
    const response = await fetch(`${url}?${query}`);
    assert.equal(response.status, 400, query);
    const body = await response.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.equal("aggregateShare" in body, false);
  }

  assert.equal(aggregate.mock.callCount(), 0);
});

test("POST acknowledges storage without returning an individual share or rating data", async (context) => {
  const { url, create } = await createFixture(context);
  const payload = { share: "123", targetId: 5, roundId: 6 };
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { id: 12 });
  assert.deepEqual(create.mock.calls[0]?.arguments[0], {
    data: payload,
    select: { id: true },
  });
});

test("POST rejects the removed rating identifier", async (context) => {
  const { url, create } = await createFixture(context);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ratingId: 101,
      share: "123",
      targetId: 5,
      roundId: 6,
    }),
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error.code, "VALIDATION_ERROR");
  assert.equal(create.mock.callCount(), 0);
});
