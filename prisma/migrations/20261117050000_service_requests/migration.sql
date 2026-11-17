-- CreateEnum
CREATE TYPE "ServiceKind" AS ENUM ('MECHANICAL', 'BODY', 'PAINT', 'ELECTRICAL', 'WASH');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('RECEIVED', 'SCHEDULED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "queueNo" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "vehicleMake" TEXT NOT NULL,
    "vehiclePlate" TEXT NOT NULL,
    "vehicleYear" INTEGER,
    "boughtFromOsk" BOOLEAN NOT NULL DEFAULT false,
    "services" "ServiceKind"[],
    "details" TEXT,
    "preferredDate" DATE,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "ip" TEXT,
    "status" "ServiceStatus" NOT NULL DEFAULT 'RECEIVED',
    "publicNote" TEXT,
    "emailedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_queueNo_key" ON "ServiceRequest"("queueNo");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_createdAt_idx" ON "ServiceRequest"("status", "createdAt");

-- Queue numbers start at 1001
ALTER SEQUENCE "ServiceRequest_queueNo_seq" RESTART WITH 1001;

ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_services_nonempty" CHECK (cardinality("services") >= 1);
