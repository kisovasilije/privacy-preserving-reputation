-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_raterId_fkey";

-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_roundId_fkey";

-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_targetId_fkey";

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
