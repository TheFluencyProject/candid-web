# candid-web

Marketing site for Candid — joincandid.co and candidtutors.co.

## Why this repo is public

Vercel's Hobby plan refuses to deploy a private repo owned by a GitHub **organization**
("Cannot deploy from a private GitHub organization repository on the Hobby plan"). That
silently stopped every deploy on 2026-07-31 — the site stayed up serving a stale build while
`main` drifted ahead. Going public was the free fix; the alternatives were upgrading to Vercel
Pro or moving the repo to a personal GitHub account.

This is safe **because this is a marketing site** — nearly everything here already ships to the
browser. Before opening it up we confirmed no secret has ever been committed anywhere in the
repo's history, and that the only credentials in the tree are publishable by design:

- `NEXT_PUBLIC_FIREBASE_*` — Firebase web config, public by design
- `POSTHOG_KEY` (`phc_…`) — PostHog project key, write-only and public by design

**So: never commit a real secret here.** Anything genuinely sensitive belongs in Vercel
environment variables, not in the tree. `candid-backend`, `candid-ios`, and
`candid-tutor-dashboard-web` are separate repos and stay private.

---

## What's inside

A Turborepo with one workspace, `apps/web` — a Next.js 15 App Router site on Tailwind,
deployed to Vercel. It serves several surfaces off the same codebase:

- **joincandid.co** — the consumer landing page
- **candidtutors.co** — the tutor-brand landing (host-conditional, same route)
- **per-tutor custom domains** — resolved at runtime and rewritten to `/tutor/{slug}`
- share pages for lessons, videos, and groups

English and Korean, via `next-intl`. Locale comes from `Accept-Language`, with the
visitor's country as a tiebreak only — see `pickLocale` in `apps/web/lib/i18n-helpers.ts`.

Content comes from the Candid API (`api.joincandid.co`); this repo is presentation only.

## Develop

```sh
npm install
npm run dev          # localhost:3000
```

```sh
npm run check-types  # tsc --noEmit
npm run build
```
