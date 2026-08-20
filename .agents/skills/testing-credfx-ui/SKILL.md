---
name: testing-credfx-ui
description: How to run and end-to-end test the CredFX frontend UI locally, including standing up a mock backend for the /api/v1 routes that the repo does not ship.
---

# End-to-end testing the CredFX web UI

## Architecture facts that matter for testing
- Frontend-only Vite + React 18 SPA. `npm install`, then `npm run dev` serves on `http://localhost:5173`.
- `vite.config.ts` proxies all `/api` requests to `http://localhost:3000`. **There is no backend in this repo**, so
  every screen is blank/empty until you provide something on port 3000.
- API base path is `/api/v1` (`src/lib/api.ts` → `API_BASE`). Auth token is stored in `localStorage` under
  `credfx_token` (`TOKEN_KEY`). On boot `App.tsx` restores the session by calling `/auth/me`; on any failure it
  clears the token and shows the login screen — so restarting a mock backend with in-memory tokens is an easy way
  to test stale-token/401 recovery.
- All styling is injected at runtime by `injectStyles()`. If the page renders dark-navy with orange accents and
  Syne headings, style injection worked. A plain unstyled page means `injectStyles` broke.
- Currency flags/names come from `src/lib/currencies.ts` (`FLAGS`/`NAMES`) and are used on dashboard wallet cards,
  FX rate cards and admin FX trends — check those three places when that module changes.

## Recommended approach: tiny local mock API on port 3000
Write a dependency-free Node HTTP server (e.g. `node mock-credfx-api.mjs`) that serves the routes below, then drive
the real UI in a browser through the Vite proxy. This is much more reliable than CDP route interception and lets
you assert on request payloads via server-side logging.

Routes exercised by the UI:
- `POST /api/v1/auth/register`, `POST /auth/verify-otp`, `POST /auth/resend-otp`, `POST /auth/login`, `GET /auth/me`
- `GET /wallet`, `POST /wallet/fund`, `POST /wallet/convert`, `POST /wallet/trade`
- `GET /fx/rates?base=XXX` (respond with `{ data: { base, rates, source } }`; `source: "live"` renders 🟢 Live,
  anything else renders 📦 Cached)
- `GET /transactions`
- `GET /admin/users`, `PATCH /admin/users/:id/role`, `GET /admin/analytics`, `GET /admin/fx-trends`,
  `GET /admin/transactions`

Tips:
- Seed several accounts so you can cover role gating and adversarial cases in one run: a plain USER with several
  balances, an ADMIN, a user with **no** balances, and a user for whom `/wallet` returns non-JSON (e.g.
  `<html>not json</html>`) — the last one proves `apiRequest` surfaces a caught `Invalid response from server`
  instead of white-screening.
- Keep tokens in memory. `pkill -f mock-credfx-api.mjs` + restart, then reload the tab, is the cheapest way to
  test the 401 recovery path. Note this also resets seeded balances/roles, so do it **last**.
- When backgrounding the server from a shell tool, use `setsid nohup node mock-credfx-api.mjs >log 2>&1 </dev/null &`;
  a plain `nohup ... &` may be killed when the shell call returns.
- Seed >20 transactions: the transactions page paginates at 20 per page, and the type filter resets to page 1.

## Math worth asserting
- Dashboard total portfolio (NGN equivalent) = sum of `balance / rate[currency]` with NGN counted 1:1, so rates
  must be expressed with NGN as base for the numbers to look sane.
- Convert is zero-fee: the portfolio total must be unchanged after a conversion.
- Trade charges 0.5% on the source side: `base = targetAmount / rate`, `fee = base * 0.005`, `total = base + fee`.
  The portfolio total should drop by exactly the fee.

## Commands
- `npm run build` — passes.
- `npm test` / `npm run test:coverage` — Vitest + jsdom; passes.
- `npm run lint` is broken in this repo (missing eslint deps / bad flat config); don't treat its failure as a regression.

## Devin Secrets Needed
None — everything runs locally with a mock backend.
