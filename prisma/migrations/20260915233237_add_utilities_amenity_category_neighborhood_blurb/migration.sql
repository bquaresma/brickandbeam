-- CreateEnum
CREATE TYPE "AmenityCategory" AS ENUM ('AMENITY', 'APPLIANCE');

-- CreateEnum
CREATE TYPE "UtilityType" AS ENUM ('WATER', 'GAS', 'ELECTRIC', 'TRASH', 'SEWER', 'INTERNET', 'CABLE', 'OTHER');

-- AlterTable
ALTER TABLE "amenities" ADD COLUMN     "category" "AmenityCategory" NOT NULL DEFAULT 'AMENITY';

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "neighborhoodBlurb" TEXT;

-- CreateTable
CREATE TABLE "utilities" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "type" "UtilityType" NOT NULL,
    "included" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilities_unitId_type_key" ON "utilities"("unitId", "type");

-- AddForeignKey
ALTER TABLE "utilities" ADD CONSTRAINT "utilities_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
