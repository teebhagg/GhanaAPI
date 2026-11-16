-- CreateTable
CREATE TABLE "bank_snapshot" (
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_snapshot_pkey" PRIMARY KEY ("key")
);
