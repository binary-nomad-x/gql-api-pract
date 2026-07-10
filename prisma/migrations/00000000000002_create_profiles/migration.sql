BEGIN;

CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
