-- Remove the unused main-API rating identifier from trusted-authority storage.
ALTER TABLE "Shares"
    DROP CONSTRAINT "Shares_ratingId_positive",
    DROP COLUMN "ratingId";
