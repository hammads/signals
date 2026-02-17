#!/usr/bin/env bash
# =============================================================================
# AI Signals Radar — Production Deployment
# =============================================================================
# Runs pre-deploy checks and deploys to Vercel production.
#
# Prerequisites:
#   - Vercel CLI: npm i -g vercel
#   - Vercel project linked: vercel link
#   - All env vars configured in Vercel dashboard
#   - Supabase migrations applied to production
#
# Usage:
#   chmod +x scripts/deploy-prod.sh
#   ./scripts/deploy-prod.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ---------------------------------------------------------------------------
# 1. Pre-flight checks
# ---------------------------------------------------------------------------
log "Running pre-deploy checks..."

if ! command -v vercel &>/dev/null; then
  err "Vercel CLI not found. Install with: npm i -g vercel"
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  warn "You have uncommitted changes. Consider committing before deploying."
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
  fi
fi

# ---------------------------------------------------------------------------
# 2. Type checking
# ---------------------------------------------------------------------------
log "Type checking..."
npx tsc --noEmit || err "Type check failed. Fix errors before deploying."

# ---------------------------------------------------------------------------
# 3. Linting
# ---------------------------------------------------------------------------
log "Linting..."
npm run lint || warn "Lint warnings found. Review before deploying."

# ---------------------------------------------------------------------------
# 4. Run tests
# ---------------------------------------------------------------------------
log "Running tests..."
npm test || err "Tests failed. Fix before deploying."

# ---------------------------------------------------------------------------
# 5. Build locally to verify
# ---------------------------------------------------------------------------
log "Building locally to verify..."
npm run build || err "Build failed. Fix errors before deploying."

# ---------------------------------------------------------------------------
# 6. Deploy to Vercel production
# ---------------------------------------------------------------------------
log "Deploying to Vercel production..."
vercel --prod

echo ""
log "=== Production deployment complete ==="
echo ""
echo "  Post-deploy checklist:"
echo "    1. Verify the production URL loads correctly"
echo "    2. Test Google OAuth login flow"
echo "    3. Check Inngest Cloud dashboard for function registration"
echo "    4. Verify Supabase production DB has latest migrations"
echo ""
