# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a T3 Stack application built with Next.js 15, featuring a modern full-stack TypeScript architecture with type-safe APIs, authentication, and database integration.

**Tech Stack:**
- Next.js 15 (App Router)
- tRPC for type-safe API routes
- Prisma ORM with PostgreSQL
- NextAuth.js v5 (beta) for authentication with Echo provider
- Tailwind CSS v4
- React 19
- TypeScript
- pnpm as package manager

## Development Commands

**Start development server:**
```bash
pnpm dev
```

**Build for production:**
```bash
pnpm build
```

**Start production server:**
```bash
pnpm start
```

**Type checking:**
```bash
pnpm typecheck
# or
pnpm check  # runs lint + typecheck
```

**Linting:**
```bash
pnpm lint       # check for issues
pnpm lint:fix   # auto-fix issues
```

**Formatting:**
```bash
pnpm format:check
pnpm format:write
```

**Database commands:**
```bash
./start-database.sh          # Start local Postgres in Docker
pnpm db:push                 # Push schema changes to DB
pnpm db:generate             # Generate Prisma client after schema changes
pnpm db:migrate              # Run migrations in production
pnpm db:studio               # Open Prisma Studio (DB GUI)
```

Note: `pnpm postinstall` automatically runs `prisma generate` after package installation.

## Architecture Overview

### Database Layer (Prisma)

- **Schema location:** `prisma/schema.prisma`
- **Generated client:** `generated/prisma/` (custom output directory)
- **Database singleton:** `src/server/db.ts` exports the Prisma client instance
- Uses PostgreSQL as the primary database
- Prisma client is generated to `generated/prisma` instead of `node_modules/.prisma`

### tRPC API Layer

The application uses tRPC for end-to-end type-safe APIs:

- **Server setup:** `src/server/api/trpc.ts` - Core tRPC initialization, context creation, and procedure definitions
- **API routers:** `src/server/api/routers/` - Define individual API endpoints
- **Root router:** `src/server/api/root.ts` - Combines all routers into `appRouter`
- **Client-side:** `src/trpc/react.tsx` - React hooks and client setup for tRPC
- **Server-side:** `src/trpc/server.ts` - Server-side tRPC caller
- **HTTP handler:** `src/app/api/trpc/[trpc]/route.ts` - Next.js App Router API endpoint

**Key concepts:**
- `publicProcedure` - Available to all users (authenticated or not)
- `protectedProcedure` - Requires authentication, throws UNAUTHORIZED if not logged in
- Context includes `db` (Prisma client) and `session` (auth session)
- Uses SuperJSON for data transformation (handles Dates, Maps, Sets, etc.)
- Development mode includes artificial delay (100-500ms) to catch waterfalls

### Authentication (NextAuth.js)

- **Config:** `src/server/auth/config.ts` - NextAuth configuration with Echo provider
- **Echo provider:** `src/server/auth/providers/echo.ts` - Custom OAuth provider for Echo authentication
- **Entry point:** `src/server/auth/index.ts` - Exports configured `auth()` helper
- **API route:** `src/app/api/auth/[...nextauth]/route.ts` - NextAuth HTTP handlers
- Uses Prisma adapter for database sessions
- Session includes user ID in addition to default fields
- Echo App ID is hardcoded in the auth config (no environment variable needed)

### Environment Variables

- **Schema:** `src/env.js` - Defines and validates all environment variables using Zod
- **Required vars:**
  - `DATABASE_URL` - PostgreSQL connection string
  - `AUTH_SECRET` - NextAuth secret (generate with `npx auth secret`)
- Set `SKIP_ENV_VALIDATION=1` to skip validation (useful for Docker builds)

### Frontend Structure

- **App Router:** `src/app/` - Next.js 15 App Router pages and layouts
- **Root layout:** `src/app/layout.tsx` - Wraps app with `TRPCReactProvider`
- **Components:** `src/app/_components/` - React components (prefix with `_` to exclude from routing)

## Adding New Features

**To add a new tRPC router:**
1. Create router file in `src/server/api/routers/your-feature.ts`
2. Define procedures using `publicProcedure` or `protectedProcedure`
3. Import and add to `appRouter` in `src/server/api/root.ts`

**To add a new database model:**
1. Add model to `prisma/schema.prisma`
2. Run `pnpm db:push` (dev) or `pnpm db:generate && pnpm db:migrate` (prod)
3. The Prisma client will be regenerated automatically in `generated/prisma/`

**To add a new auth provider:**
1. Add provider to `src/server/auth/config.ts`
2. Add required env vars to `src/env.js`
3. Update Prisma schema if provider requires additional fields

## Important Notes

- Prisma client is generated to `generated/prisma/` not the default location
- Import Prisma client from `~/server/db` not directly from generated folder
- NextAuth is v5 (beta) - some APIs differ from v4
- The app uses React 19 and Next.js 15 - ensure compatibility when adding packages
- tRPC procedures have artificial delays in development to simulate production latency
