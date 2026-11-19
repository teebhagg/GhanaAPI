-- Correct GHS -> NGN history that was stored upside down.
--
-- The Bank of Ghana publishes the naira as naira per GHS (pair GHSNGN, about
-- 116), but the provider read it as GHS per naira (about 0.0086). Every
-- GHS -> NGN snapshot it saved before the fix in PR 53 therefore holds the
-- inverse of the real rate.
--
-- A real GHS -> NGN rate is far above 1, so any such row below 1 is inverted.
-- On the live data no row falls between 0.05 and 20, so the rule is
-- unambiguous. Only rows from the bank-of-ghana provider are changed, since
-- that is where the bug was. Other providers, other currencies and the reverse
-- pair (NGN -> GHS) are not touched.
--
-- The rate column holds 8 decimals, and inverting twice at that precision
-- gives the original value back, so this can be undone exactly. See
-- docs/docs/CHANGELOG.md for the rollback statement. Take a backup (for
-- example a Neon branch) before applying it to production.

DO $$
DECLARE
  corrected integer;
BEGIN
  UPDATE "exchange_rate_history"
  SET "rate" = ROUND(1 / "rate", 8)
  WHERE "baseCurrency" = 'GHS'
    AND "targetCurrency" = 'NGN'
    AND "provider" = 'bank-of-ghana'
    AND "rate" > 0
    AND "rate" < 1;

  GET DIAGNOSTICS corrected = ROW_COUNT;
  RAISE NOTICE 'Corrected % inverted GHS -> NGN history rows', corrected;
END $$;
