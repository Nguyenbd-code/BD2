# Brown Dust 2 Companion Site

A full-stack fan companion site for the mobile game **Brown Dust 2**, built and maintained solo and used by a live player community.

**Live site:** https://browndust2-bnkitsu.com

## Features

- **PvP Guide:** team compositions grouped by tier, with board positioning, skill rotations, counters, and video clips
- **Characters:** a catalog of characters with their costumes, elements, and skills
- **Coupons:** an up-to-date list of active coupon codes, with in-site redemption
- **Kitsu's Emotes:** collectible emote sets hidden behind puzzles scattered across the site
- **Admin panel:** a password-protected CMS for managing every page's content and images without touching code

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Frontend | Server-rendered HTML, CSS, and vanilla JavaScript (no framework) |
| Tooling | Wrangler |

## Architecture

```
Browser ──> Cloudflare Worker (src/index.js)
              ├── pages/    server-rendered HTML for each route
              ├── api/      JSON endpoints (admin, images, redeem, video embeds)
              ├── layout/   shared page shell and navigation
              └── lib/      auth and caching helpers
                    │
                    ▼
              Cloudflare D1 (SQLite)
```

- **One Worker, no framework:** every request goes through a single router that renders pages on the server, so the site works without a client-side build step.
- **D1 as the content store:** characters, compositions, coupons, emotes, and uploaded images all live in D1, versioned with SQL migrations in `migrations/`.
- **Admin authentication:** sessions are HMAC-SHA256 signed cookies (`HttpOnly`, `Secure`, `SameSite=Lax`). The signing key is generated server-side and never stored in source, and signatures are compared in constant time.
- **Caching:** frequently read data is memoized in the Worker isolate with a short TTL, cutting repeat database round trips, and the cache is cleared after admin writes.

## Project Structure

```
src/
  index.js      router
  pages/        home, guide, characters, coupons, emotes, admin, 404
  api/          admin, images, redeem, x-video embeds
  layout/       page shell and navigation
  lib/          auth, cache
  css/          styles
  data/         static game data
migrations/     D1 schema
```

## Running Locally

```bash
npm install
npx wrangler d1 migrations apply bnkitsu-bd2 --local
npm run dev        # http://localhost:8787
```

Deploy with `npm run deploy`. Set the admin password as a Worker secret first:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

## Author

Brandon Nguyen ([GitHub](https://github.com/Nguyenbd-code) · [Portfolio](https://nguyenbd-code.github.io))

*Fan project, not affiliated with the developers of Brown Dust 2.*
