-- CreateTable
CREATE TABLE "exchange_rate_history" (
    "id" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "targetCurrency" TEXT NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "provider" TEXT NOT NULL,
    "sourceTimestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rate_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_rate_history_baseCurrency_targetCurrency_sourceTim_idx" ON "exchange_rate_history"("baseCurrency", "targetCurrency", "sourceTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "uq_exchange_rate_snapshot" ON "exchange_rate_history"("baseCurrency", "targetCurrency", "sourceTimestamp", "provider");
