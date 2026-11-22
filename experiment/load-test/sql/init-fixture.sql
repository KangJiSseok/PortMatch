\set ON_ERROR_STOP on
\getenv rows BENCH_ROWS
SELECT :'rows' = '5000' AS small, :'rows' = '100000' AS large \gset
\if :small
  \i /opt/portmatch/seed-5k.sql
\elif :large
  \i /opt/portmatch/seed-100k.sql
\else
  DO $$ BEGIN RAISE EXCEPTION 'BENCH_ROWS must be 5000 or 100000'; END $$;
\endif
