-- Run with: wrangler d1 execute bnkitsu-bd2 --file=migrations/002_add_sort_order.sql --remote
ALTER TABLE compositions ADD COLUMN sort_order INTEGER DEFAULT 0;
