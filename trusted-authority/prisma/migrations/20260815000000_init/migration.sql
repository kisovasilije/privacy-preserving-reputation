-- CreateTable
CREATE TABLE "Shares" (
    "id" SERIAL NOT NULL,
    "ratingId" INTEGER NOT NULL,
    "share" DECIMAL(78, 0) NOT NULL,
    "targetId" INTEGER NOT NULL,
    "roundId" INTEGER NOT NULL,

    CONSTRAINT "Shares_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Shares_ratingId_positive" CHECK ("ratingId" > 0),
    CONSTRAINT "Shares_targetId_positive" CHECK ("targetId" > 0),
    CONSTRAINT "Shares_roundId_positive" CHECK ("roundId" > 0),
    CONSTRAINT "Shares_share_bn254_canonical" CHECK (
        "share" >= 0 AND
        "share" < 21888242871839275222246405745257275088548364400416034343698204186575808495617
    )
);

-- CreateIndex
CREATE INDEX "Shares_roundId_targetId_idx" ON "Shares"("roundId", "targetId");
