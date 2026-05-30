/*
  Warnings:

  - Added the required column `proof` to the `ratings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicSignals` to the `ratings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ratings" ADD COLUMN     "proof" JSONB NOT NULL,
ADD COLUMN     "publicSignals" JSONB NOT NULL;
