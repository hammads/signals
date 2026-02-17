#!/usr/bin/env bash
# =============================================================================
# AI Signals Radar — Preview Deployment
# =============================================================================
# Deploys a preview build to Vercel for testing and review.
# Lighter checks than production — skips full test suite.
#
# Usage:
#   chmod +x scripts/deploy-preview.sh
#   ./scripts/deploy-preview.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[preview]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ---------------------------------------------------------------------------
# 1. Pre-flight checks
# ---------------------------------------------------------------------------
if ! command -v vercel &>/dev/null; then
  err "Vercel CLI not found. Install with: npm i -g vercel"
fi

# ---------------------------------------------------------------------------
# 2. Quick type check
# ---------------------------------------------------------------------------
log "Type checking..."
npx tsc --noEmit || err "Type check failed."

# ---------------------------------------------------------------------------
# 3. Deploy preview
# ---------------------------------------------------------------------------
log "Deploying preview to Vercel..."
PREVIEW_URL=$(vercel 2>&1 | tail -1)

echo ""
log "=== Preview deployment complete ==="
echo ""
echo "  Preview URL: $PREVIEW_URL"
echo ""
echo "  To promote to production:"
echo "    vercel promote $PREVIEW_URL"
echo "  Or run:"
echo "    ./scripts/deploy-prod.sh"
echo ""
