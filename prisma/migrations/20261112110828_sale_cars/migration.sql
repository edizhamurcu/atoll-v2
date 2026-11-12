-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'HIDDEN');

-- CreateTable
CREATE TABLE "SaleCar" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileageKm" INTEGER NOT NULL,
    "fuel" "FuelType" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "bodyType" "BodyType",
    "colour" TEXT,
    "price" DECIMAL(10,2),
    "note" TEXT,
    "photos" TEXT[],
    "status" "SaleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "soldAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SaleCar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SaleCar_status_sortOrder_idx" ON "SaleCar"("status", "sortOrder");

ALTER TABLE "SaleCar" ADD CONSTRAINT "SaleCar_year_check" CHECK ("year" BETWEEN 1950 AND 2100);
ALTER TABLE "SaleCar" ADD CONSTRAINT "SaleCar_km_check" CHECK ("mileageKm" >= 0);
