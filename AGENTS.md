<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# Flowmeter

Focus timer web app. The entire app is public/flowmeter.html (plain HTML, CSS, JS), served at / through a rewrite in next.config.ts. Hosted on Vercel. Accounts and database on Supabase.

## Commands
- `npm run dev`: local server at http://localhost:3000
- `npm run lint` and `npm run typecheck`: must pass before every PR

## Rules
- Always work on a branch and open a PR. main is protected: CI and the Vercel build must pass.
- Never put secret keys in code, Git, or logs. The only Supabase key allowed in the app is the publishable key.
- Never change the database structure in the Supabase dashboard. Every structure change is a new file from `npx supabase migration new <name>`, reviewed in the PR, and applied with `npx supabase db push` only after merge.
- Every new table must enable row level security, with policies limited to the row's owner.
- Rules that protect data belong in the database (constraints, RLS), not only in the UI.
- Never run `npm audit fix --force`.
- Scripts loaded from a CDN must be pinned to an exact version.

## Before changing anything that stores or syncs data, answer these in the PR description
1. Who may see or change this data? Is it protected by RLS?
2. Does anything secret end up in client code, Git, or logs?
3. What happens if a different user signs in on the same browser?
4. What happens if two devices change the same item?
5. What happens if an item is deleted on one device while another is offline?
6. What happens with no internet connection?
7. What happens when there are more than 1000 items?