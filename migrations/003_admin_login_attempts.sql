-- Run with: wrangler d1 execute bnkitsu-bd2 --file=migrations/003_admin_login_attempts.sql --remote
-- Tracks failed admin logins per IP so repeated guesses get locked out.
-- The Worker also creates this table on first use, so running this is optional.
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  ip           TEXT PRIMARY KEY,
  failures     INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
