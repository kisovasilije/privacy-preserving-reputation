/*
  Warnings:

  - You are about to drop the `rating_rounds` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[roundId,raterId,targetId]` on the table `ratings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `roundId` to the `ratings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "rating_rounds" DROP CONSTRAINT "rating_rounds_authorId_fkey";

-- AlterTable
ALTER TABLE "ratings" ADD COLUMN     "roundId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "rating_rounds";

-- CreateTable
CREATE TABLE "rounds" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aggregates" (
    "id" SERIAL NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "sum" INTEGER NOT NULL DEFAULT 0,
    "average" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roundId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,

    CONSTRAINT "aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aggregates_roundId_targetId_key" ON "aggregates"("roundId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_roundId_raterId_targetId_key" ON "ratings"("roundId", "raterId", "targetId");

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aggregates" ADD CONSTRAINT "aggregates_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aggregates" ADD CONSTRAINT "aggregates_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
