-- DropIndex
DROP INDEX "ratings_roundId_raterId_targetId_key";

-- AlterTable
ALTER TABLE "ratings"
DROP COLUMN "value",
ALTER COLUMN "roundId" DROP NOT NULL,
ALTER COLUMN "raterId" DROP NOT NULL,
ALTER COLUMN "targetId" DROP NOT NULL;
