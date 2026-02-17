#!/usr/bin/env bash
# =============================================================================
# AI Signals Radar — Production Database Migration
# =============================================================================
# Applies Supabase migrations to the production database.
#
# Prerequisites:
#   - Supabase CLI linked to your project: supabase link --project-ref <ref>
#   - SUPABASE_DB_PASSWORD env var set (or it will prompt)
#
# Usage:
#   chmod +x scripts/db-migrate-prod.sh
#   ./scripts/db-migrate-prod.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[db]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

if ! command -v supabase &>/dev/null; then
  err "Supabase CLI not found. Install with: npm i -g supabase"
fi

# ---------------------------------------------------------------------------
# Safety confirmation
# ---------------------------------------------------------------------------
warn "This will apply migrations to your PRODUCTION Supabase database."
warn "Make sure you have a backup or are confident in the migration."
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  log "Aborted."
  exit 0
fi

# ---------------------------------------------------------------------------
# Show pending migrations
# ---------------------------------------------------------------------------
log "Checking migration status..."
supabase migration list 2>/dev/null || warn "Could not list migrations (is the project linked?)"

# ---------------------------------------------------------------------------
# Apply migrations
# ---------------------------------------------------------------------------
log "Pushing migrations to production..."
supabase db push

echo ""
log "=== Database migration complete ==="
echo ""
echo "  Verify your tables in the Supabase dashboard:"
echo "    https://supabase.com/dashboard/project/_/editor"
echo ""
echo "  If you need to seed data:"
echo "    psql \$DATABASE_URL < supabase/seed.sql"
echo ""
