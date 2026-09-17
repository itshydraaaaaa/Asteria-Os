#!/usr/bin/env bash
# start-litellm.sh — exports placeholder keys and starts the LiteLLM proxy.
# Usage: bash scripts/start-litellm.sh
#
# Replace the placeholder values below with your real free-tier API keys,
# or export them before running this script (existing env vars win).
set -euo pipefail

# ── API keys (set these or export before running) ──────────────────────
export GEMINI_API_KEY="${GEMINI_API_KEY:-your-google-ai-studio-key-here}"
export GROQ_API_KEY="${GROQ_API_KEY:-your-groq-console-key-here}"
export OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-your-openrouter-key-here}"
export LITELLM_MASTER_KEY="${LITELLM_MASTER_KEY:-sk-litellm-master-key}"

# ── Resolve config path relative to repo root ─────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG="$REPO_ROOT/litellm_config.yaml"

echo "[LiteLLM] Starting proxy on http://localhost:8000"
echo "[LiteLLM] Config: $CONFIG"
echo "[LiteLLM] Fallback chain: Google AI Studio -> Groq -> OpenRouter"
echo ""

# ── Start the proxy (foreground so logs are visible) ───────────────────
# Add --background to daemonize, or & to background in shell.
litellm --config "$CONFIG" --port 8000 --detailed_debug
