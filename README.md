# DEFY TPO — Closing Doc Order

Broker-facing form that submits a closing document request to the DEFY doc drawing team.

**Live:** https://docorder.defywholesale.com

## What it does

A broker completes one page — loan details, contact parties, broker fee breakdown, notes —
and submits. The serverless function renders the submission as a branded HTML email and
sends it via Resend to the doc drawing desk. There is no database and no login.

## Stack

| | |
|---|---|
| Frontend | React 19 + Vite 8 + Tailwind v4 |
| API | One Vercel serverless function (`api/send.ts`) |
| Email | Resend, `defywholesale.com` sending domain |
| Hosting | Vercel (project `docorderdefyv1`) |

## Form behaviour

- **Loan Purpose drives the contact section.** Refinance shows a single
  *Escrow / Settlement* block. Purchase additionally stacks *Buyer's Agent* and
  *Seller's Agent* blocks beneath it. The email mirrors this — agent columns only
  appear on a Purchase.
- The **Underwriting Fee** and **Discount Fee** are read-only defaults.
- Everything is client-side state; nothing persists between submissions.

## Environment

Copy `.env.example` to `.env`. Only `RESEND_API_KEY` is required — the other two have
correct production defaults baked into `api/send.ts`.

| Variable | Required | Default |
|---|---|---|
| `RESEND_API_KEY` | **yes** | — |
| `RESEND_FROM_EMAIL` | no | `docorder@defywholesale.com` |
| `RESEND_TO_EMAILS` | no | `setup@defywholesale.com` (comma-separated for multiple) |

> **A Vercel environment variable overrides the code default.** If one of the optional
> variables is set in Vercel, editing the fallback in `api/send.ts` changes nothing.
> Change the environment variable instead.

`RESEND_TO_EMAILS` targets `setup@defywholesale.com`, which routes through the Cloudflare
`submission-conditions` Email Worker on the `defywholesale.com` zone.

## Develop

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc -b && vite build
npm run lint
npm run preview
```

Deploy: `npx vercel --prod`

> **`npm run build` does not type-check `api/`.** `tsc -b` covers `src/` only, so a broken
> import in a serverless function still produces a green local build. Read the Vercel build
> log after deploying.

> `vercel.json` ends with a SPA catch-all, so **any** unmatched `/api/*` path returns
> `200` and `index.html`. A 200 on an API route does not prove the function exists —
> check the deployment's function list.

## Brand

Follows the DEFY Wholesale design system (light theme): `#24788F` primary,
`#1F6478` hover, DM Sans body / Manrope display, 3px surfaces and 5px buttons.
All text is verified to WCAG AA against its own background.

Legal footer is exactly: `Defy Mortgage, LLC · NMLS #2383214`
