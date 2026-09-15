-- CreateEnum
CREATE TYPE "ParkingType" AS ENUM ('GARAGE_ATTACHED', 'GARAGE_LOT', 'COVERED_LOT', 'STREET', 'SURFACE_LOT', 'OTHER', 'NONE');

-- CreateEnum
CREATE TYPE "PetType" AS ENUM ('DOGS', 'CATS', 'BIRDS', 'REPTILES', 'FISH', 'OTHER');

-- CreateEnum
CREATE TYPE "PetSize" AS ENUM ('SMALL', 'LARGE');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('SECURITY_DEPOSIT', 'APPLICATION_FEE', 'PET_RENT', 'PET_DEPOSIT', 'PET_FEE', 'PARKING_FEE', 'PARKING_PERMIT', 'STORAGE_FEE', 'SEWER_FEE', 'GARBAGE_FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "FeeTiming" AS ENUM ('MOVE_IN', 'AT_APPLICATION', 'MONTHLY', 'ONE_TIME_OTHER', 'RECURRING_OTHER');

-- CreateEnum
CREATE TYPE "FeeRequirement" AS ENUM ('MANDATORY', 'OPTIONAL', 'SITUATIONAL');

-- CreateEnum
CREATE TYPE "FeeRefundable" AS ENUM ('REFUNDABLE', 'NON_REFUNDABLE');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "leaseTerm" TEXT,
ADD COLUMN     "previewMessage" TEXT,
ADD COLUMN     "virtualTourUrl" TEXT;

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "dateAvailable" TIMESTAMP(3),
ADD COLUMN     "isFurnished" BOOLEAN,
ADD COLUMN     "parkingType" "ParkingType",
ADD COLUMN     "smokingAllowed" BOOLEAN;

-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_policies" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "petType" "PetType" NOT NULL,
    "petSize" "PetSize",
    "allowed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fees" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "type" "FeeType" NOT NULL,
    "amountCents" INTEGER,
    "description" TEXT,
    "timing" "FeeTiming" NOT NULL,
    "requirement" "FeeRequirement" NOT NULL DEFAULT 'MANDATORY',
    "refundable" "FeeRefundable",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fees_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_policies" ADD CONSTRAINT "pet_policies_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fees" ADD CONSTRAINT "fees_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
