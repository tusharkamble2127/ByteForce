<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# GatePass Project Information

## Overview
GatePass is a QR-based event check-in application built with TanStack Start, Supabase, and React.

## Tech Stack
- **Framework**: TanStack Start (React-based full-stack framework)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password + OAuth)
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **QR Generation**: qrcode.react
- **QR Scanning**: @yudiel/react-qr-scanner
- **Package Manager**: Bun (or npm as fallback)

## Project Structure
- `src/routes/` - TanStack Start file-based routing
- `src/components/` - Reusable React components
- `src/components/ui/` - shadcn/ui components
- `src/integrations/supabase/` - Supabase client configuration
- `drizzle/migrations/` - Database migrations
- `src/styles.css` - Global styles and design system

## Key Files
- `src/routes/index.tsx` - Main application (auth, dashboard, registration, check-in)
- `src/components/QrScanner.tsx` - QR scanner component
- `drizzle/migrations/0000_create_attendees.sql` - Initial schema
- `drizzle/migrations/0001_improve_check_in.sql` - Atomic check-in function

## Database Schema
### attendees table
- `id` (uuid, primary key)
- `organizer_id` (uuid, references auth.uid())
- `name` (text)
- `email` (text)
- `ticket_type` (text, default: 'General')
- `code` (text, unique, 10-char uppercase)
- `checked_in_at` (timestamptz, nullable)
- `created_at` (timestamptz)

### Security
- Row-Level Security (RLS) enabled
- Policies ensure organizers only access their own attendees
- `check_in()` function uses row locking for atomic duplicate prevention

## Build Commands
```bash
# Development
bun run dev
# or
npm run dev

# Production build
bun run build
# or
npm run build

# Lint
bun run lint
# or
npm run lint

# Format
bun run format
# or
npm run format

# Test
bun run test
# or
npm run test
```

## Environment Variables
Required (see `.env.example`):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable/anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

## Design System
- Background: Dark charcoal (oklch)
- Primary accent: Luminous lime green (#C5F34A)
- Typography: Space Grotesk (sans), JetBrains Mono (mono)
- Border radius: 0.75rem (12px)
- Animations: 150-300ms transitions, cubic-bezier easing

## Important Notes
- DO NOT rewrite git history (connected to Lovable)
- Preserve working functionality when making changes
- Test QR scanning after any scanner modifications
- Apply database migrations in order (0000, then 0001)
- Never commit real API keys or secrets
- Use existing UI components from shadcn/ui when possible
