# SKY — AI Investor Shadow Assistant

SKY is an investor intelligence workspace for selective research, opportunity detection, human approval and controlled engagement.

## API stack
SKY does **not** require Tavily, Exa, Brave, SerpAPI or another dedicated search API.

- **OpenAI API / Responses API** — AI generation, analysis and web search.
- **Meta Graph API** — Facebook Page OAuth, authorized Page data, comments, publishing and messaging where Meta permits it.
- **Supabase API** — Auth, PostgreSQL, Edge Functions and optional Realtime/Storage.

The application server is the security boundary. Provider secrets never reach browser JavaScript.

## Architecture
- Next.js App Router + TypeScript
- Supabase Auth + PostgreSQL + RLS
- Server-side OpenAI Responses API with web search
- Workspace-scoped data access
- Encrypted server-side integration secrets
- Meta OAuth; never Facebook passwords
- Supabase Edge Functions
- No Vercel dependency

## Local setup
1. Configure Supabase.
2. Apply `supabase/migrations`.
3. Copy `.env.example` to `.env.local`.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
6. Set `SECRET_ENCRYPTION_KEY` to a 64-character hex value.
7. Configure Meta variables when Facebook is enabled.
8. Run `npm ci`.
9. Run `npm run dev`.

## OpenAI
Configure OpenAI from **Settings → Integrations**. SKY validates the submitted key and stores it encrypted; the raw key is never returned to the browser.

Research uses the OpenAI Responses API web-search tool. There is no separate search-provider credential. OpenAI's current API documentation uses Responses API for direct model requests and tool-enabled workflows.

## Facebook / Meta
Required server variables:
- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI`

SKY uses Meta OAuth and only capabilities granted to the connected Page/business asset. Unsupported capabilities are reported instead of faked.

## Implemented workflows
- Investment profile and onboarding safety defaults
- OpenAI web research
- Company/person/opportunity pipeline
- Opportunity scoring
- Facebook OAuth and Page synchronization
- Facebook post/comment synchronization
- Comment intelligence
- AI reply drafting
- Human approval queue
- AI post generation
- Controlled publishing/replies
- Content scheduling records
- Automation rule CRUD
- In-app notifications
- Daily investor briefing
- Activity logging
- Production health endpoint
- GitHub Actions CI
- Production database indexes

## Safety defaults
- Automatic posts: OFF
- Automatic comments: OFF
- Automatic messages: OFF
- Approval required: ON
- Automated replies/day: 10
- Minimum relevance: 85
- Minimum confidence: 85
- Person cooldown: 7 days

## Deployment
SKY does not require Vercel. Use any Node.js 22+ host that supports the Next.js App Router, configure the environment secrets, and run `npm run start`.

Use Supabase Edge Functions plus Supabase scheduling/cron or an equivalent scheduler for background work. Do not put long-running jobs in browser requests.

## Security
Never expose OpenAI keys, Meta secrets, Facebook access tokens, Supabase service-role keys or `SECRET_ENCRYPTION_KEY` in client code. Never commit `.env.local`.

All workspace data uses UUIDs, foreign keys, indexes and RLS. Server routes resolve the current workspace through authenticated membership instead of trusting a workspace id from the browser.

## Launch checklist
- Apply all production Supabase migrations.
- Configure OpenAI from SKY Settings.
- Configure the Meta app and OAuth redirect URI.
- Complete Meta permission/app-review requirements for the intended Page capabilities.
- Configure production secrets in the host secret manager.
- Verify `/api/health`.
- Run GitHub Actions CI.
- Test login, RLS, research, approvals and every granted Meta capability.
- Keep automatic posts/comments/messages disabled until the approval flow is verified.

## Credentials required
**OpenAI:** one OpenAI API key.

**Facebook:** Meta App ID + Meta App Secret, followed by user OAuth authorization. A Facebook password is never entered into SKY.

**Search:** no separate web-search API key; SKY uses OpenAI web search.
