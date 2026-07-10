BEGIN;

CREATE TABLE "return_requests" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "return_requests_orderItemId_idx" ON "return_requests"("orderItemId");
CREATE INDEX "return_requests_userId_idx" ON "return_requests"("userId");
CREATE INDEX "return_requests_status_idx" ON "return_requests"("status");

ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
