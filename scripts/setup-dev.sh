#!/usr/bin/env bash
# =============================================================================
# AI Signals Radar — Local Development Setup
# =============================================================================
# Run this once after cloning to set up your local development environment.
#
# Prerequisites:
#   - Node.js 20+
#   - npm
#   - Supabase CLI (npm install -g supabase)
#   - A Supabase project (or local Supabase via `supabase start`)
#
# Usage:
#   chmod +x scripts/setup-dev.sh
#   ./scripts/setup-dev.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[setup]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err()  { echo -e "${RED}[error]${NC} $1"; }

# ---------------------------------------------------------------------------
# 1. Check prerequisites
# ---------------------------------------------------------------------------
log "Checking prerequisites..."

if ! command -v node &>/dev/null; then
  err "Node.js is not installed. Please install Node.js 20+."
  exit 1
fi

NODE_MAJOR=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 20 ]; then
  warn "Node.js $NODE_MAJOR detected. Version 20+ is recommended."
fi

if ! command -v npm &>/dev/null; then
  err "npm is not installed."
  exit 1
fi

log "Node $(node -v), npm $(npm -v)"

# ---------------------------------------------------------------------------
# 2. Install dependencies
# ---------------------------------------------------------------------------
log "Installing npm dependencies..."
npm install

# ---------------------------------------------------------------------------
# 3. Set up environment variables
# ---------------------------------------------------------------------------
if [ ! -f .env.local ]; then
  log "Creating .env.local from template..."
  cp .env.local.example .env.local
  warn ".env.local created — please fill in your API keys before starting the app."
  warn "Required keys: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, OPENAI_API_KEY"
else
  log ".env.local already exists, skipping."
fi

# ---------------------------------------------------------------------------
# 4. Supabase setup (if CLI available)
# ---------------------------------------------------------------------------
if command -v supabase &>/dev/null; then
  log "Supabase CLI detected."

  if supabase status &>/dev/null 2>&1; then
    log "Local Supabase is running."
  else
    warn "Local Supabase is not running. Start it with: supabase start"
    warn "Then run migrations with: npm run db:migrate"
  fi
else
  warn "Supabase CLI not found. Install it with: npm install -g supabase"
  warn "Alternatively, run the migration SQL manually against your hosted Supabase project:"
  warn "  supabase/migrations/00001_initial_schema.sql"
fi

# ---------------------------------------------------------------------------
# 5. Install Playwright browsers (for E2E tests)
# ---------------------------------------------------------------------------
log "Installing Playwright browsers..."
npx playwright install chromium --with-deps 2>/dev/null || warn "Playwright browser install skipped (run 'npx playwright install' manually if needed)."

# ---------------------------------------------------------------------------
# 6. Type check
# ---------------------------------------------------------------------------
log "Running type check..."
npx tsc --noEmit || warn "Type check found issues — review and fix before deploying."

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo ""
log "=== Setup complete ==="
echo ""
echo "  Start developing:"
echo "    npm run dev              — Next.js dev server on http://localhost:3005"
echo "    npm run dev              — Next.js + Inngest (both in parallel)"
echo "    npm run dev:inngest      — Inngest dev server only"
echo ""
echo "  Database:"
echo "    npm run db:migrate       — Push migrations to Supabase"
echo "    npm run db:seed          — Reset DB and seed sample data"
echo "    npm run db:types         — Regenerate TypeScript types from DB"
echo ""
echo "  Testing:"
echo "    npm test                 — Unit + integration tests"
echo "    npm run test:e2e         — Playwright E2E tests"
echo "    npm run test:all         — Typecheck + all tests"
echo ""
