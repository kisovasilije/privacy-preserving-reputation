# Retry-safety review

Reviewed merged commit 71413132b15c5bf131319f73c3a2dcd8f7904cd4 (PR #1).

## Finding: duplicate delivery inflates aggregate counts

trusted-authority/src/routes/shares.ts unconditionally inserts on POST. Share has only the auto-increment id as a unique key. GET sums and counts matching rows in one query; this is internally consistent but counts deliveries rather than logical ratings. Aggregate-only responses preserve the existing response boundary, but do not prevent replay.

One rating with shares (1, 1, 3) reconstructs to 5. Delivering it twice to all authorities yields aggregate shares (2, 2, 6), count 2 everywhere, and average 5. Count agreement and scale validation both pass. Partial delivery followed by a full retry can instead produce counts (2, 1, 1), causing results to fail. Concurrent retries have the same insert problem.

The frontend uses forkJoin for three POSTs, which neither rolls back accepted writes nor proves that a cancelled or failed request was not stored. HomePageComponent regenerates a submission on a fresh submit; it does not retain the original rating ID and share tuple for recovery.

## Smallest proposed change (not implemented here)

1. Use the existing globally issued ratingId as the local unique key (@unique), after confirming that its global uniqueness is a protocol invariant. Bind roundId, targetId and share immutably to that identity. If IDs are intentionally scoped instead, define that scope explicitly and use a composite unique key; do not silently allow one global rating to be inserted into another target or round.
2. Attempt an insert protected by the database unique constraint. On the corresponding unique conflict, fetch only that local row internally and compare its canonical share and context. Identical retry returns the same { id } acknowledgement (201 can remain for compatibility). Changed payload returns a generic 409 without echoing stored values. Do not overwrite, use share-value uniqueness, or rely on a read-before-insert check. Only handle the intended unique conflict; propagate unrelated failures. The database key is what arbitrates concurrent delivery.
3. Retain the original rating ID and exact three canonical shares as a durable pending submission before dispatch. Retry the same payloads to all three authorities until all acknowledge. Never generate fresh shares or create a new rating during delivery recovery. Give the initial rating creation its own stable idempotency key if its acknowledgement can be lost too. A server outbox must not collect all three plaintext shares: that would allow individual-rating reconstruction. A client-held pending record, or separate encrypted authority-specific envelopes, preserves separation.
4. Local deduplication plus eventual retries does not make three databases atomic. For a minimal deployment, publish results only for a frozen round whose expected opaque submission identities have been reconciled and fully delivered to all three stores. For live results, add a coordinated completed-batch/version protocol and aggregate the same committed version on every authority; a local completed flag alone is insufficient. Equal counts cannot prove equal membership. Keep completion reconciliation internal and never add a public per-rating share endpoint.

This reuses metadata authorities already receive. It does not expose share values or reconstruct individual ratings, but it also does not solve authorization, forged submissions, or repeated logical votes issued new IDs. Those require a trusted admission/identity policy.

## Migration and verification

Before adding uniqueness, inspect duplicate rating identities independently inside each authority. Collapse exact local duplicates only after confirming identity semantics. Conflicting payloads and cross-authority missing entries need reconciliation against an authoritative submission manifest; do not arbitrarily choose a share or assume equal counts mean equal sets. Historical aggregates may already be wrong.

The new tests are characterization tests against a stateful append-only Prisma stub and real HTTP routes. They deliberately assert the vulnerable merged behavior, including modulo reduction and response shapes. They are not PostgreSQL integration tests and do not establish database concurrency guarantees. Once the fix is implemented, replace the inflation assertions with one-row/same-ack expectations; add changed-share/context 409 tests, distinct-rating preservation, actual PostgreSQL concurrent inserts, and client recovery tests across partial delivery and reload. Preserve aggregate-only GET and acknowledgement-only POST responses.
