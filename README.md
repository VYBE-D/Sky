# SKY — AI Investor Shadow Assistant

Sky is a production-oriented investor intelligence workspace built around selective research, opportunity detection, human approval and controlled engagement.

## Architecture
- Next.js App Router + TypeScript
- Supabase Auth + PostgreSQL + RLS
- Server-side OpenAI Responses API with web search
- Encrypted server-side integration secrets
- Meta OAuth integration boundary (never Facebook passwords)
- No Vercel dependency

## Local setup
1. Create a Supabase project and apply the Sky schema in your SQL migration/environment.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Generate a 32-byte encryption key and put its 64-character hex value in `SECRET_ENCRYPTION_KEY`.
5. `npm install`
6. `npm run dev`

## OpenAI
OpenAI is configured from **Settings → Integrations**. The browser submits the key to a server route; Sky validates it, encrypts it with AES-256-GCM, and stores only the encrypted value in Supabase. The raw key is never returned to the client and must never be committed.

Web research is performed server-side through the OpenAI Responses API web-search tool. The AI layer is isolated in `lib/ai.ts` so another provider can be introduced later.

## Supabase
The live VYBE Supabase project contains workspace-scoped tables for profiles, workspaces, investment profiles, research, companies, people, opportunities, Facebook data, content, approvals, tasks, automation, notifications, activity and AI generations. RLS is enabled and workspace membership is enforced server-side and in database policies.

For production, keep `SUPABASE_SERVICE_ROLE_KEY` server-only and rotate all secrets if exposure is suspected.

## Facebook / Meta
Sky intentionally does not implement username/password automation. Facebook actions must be backed by Meta OAuth and only permissions available to the connected Page/business asset are used. Unsupported capabilities are reported rather than faked.

## Safety defaults
- Automatic posts: OFF
- Automatic comments: OFF
- Automatic messages: OFF
- Approval required: ON
- Default automated replies/day: 10
- Minimum relevance: 85
- Minimum confidence: 85
- Person cooldown: 7 days

## Deployment
Sky is framework-portable and does not require Vercel. Deploy the Next.js server to any Node-compatible host and keep Supabase as the managed backend. Configure environment variables in the host's secret manager.

## Security
Never put OpenAI, Meta app secrets, Supabase service-role keys, or encrypted-secret keys in client code. Never commit `.env.local`. All workspace data uses UUID foreign keys, timestamps, indexes and RLS.

## Current build
The repository now contains the application shell, authentication UI, workspace dashboard, live Supabase queries, OpenAI integration configuration, encrypted key storage, OpenAI web research, research run logging, activity logging and data-driven workspace sections. Meta OAuth and publishing require the user's Meta app configuration and approved capabilities before they can be enabled.
