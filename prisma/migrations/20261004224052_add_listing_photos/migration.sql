-- CreateEnum
CREATE TYPE "PhotoKind" AS ENUM ('PHOTO', 'FLOOR_PLAN');

-- CreateEnum
CREATE TYPE "PhotoArea" AS ENUM ('EXTERIOR', 'LIVING', 'KITCHEN', 'BATHROOM', 'BEDROOM', 'BASEMENT', 'ATTIC', 'OUTDOOR', 'DETAIL', 'OTHER');

-- CreateTable
CREATE TABLE "listing_photos" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "kind" "PhotoKind" NOT NULL DEFAULT 'PHOTO',
    "area" "PhotoArea" NOT NULL DEFAULT 'OTHER',
    "level" TEXT,
    "caption" TEXT,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isHero" BOOLEAN NOT NULL DEFAULT false,
    "masterKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "placeholder" TEXT,
    "variants" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_photos_listingId_sortOrder_idx" ON "listing_photos"("listingId", "sortOrder");

-- AddForeignKey
ALTER TABLE "listing_photos" ADD CONSTRAINT "listing_photos_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
