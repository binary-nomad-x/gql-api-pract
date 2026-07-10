BEGIN;

CREATE TABLE "discounts" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUsage" INTEGER NOT NULL DEFAULT 0,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "discounts_productId_idx" ON "discounts"("productId");
CREATE INDEX "discounts_startDate_endDate_idx" ON "discounts"("startDate", "endDate");

ALTER TABLE "discounts" ADD CONSTRAINT "discounts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
