#!/usr/bin/env bash
# Deploy PincerPay Anchor program to Solana devnet (run from WSL2)
#
# Prerequisites:
#   - Anchor CLI 0.31.1+ (`anchor --version`)
#   - Solana CLI 3.0.15+ (`solana --version`)
#   - Authority keypair at ~/.config/solana/id.json
#   - Sufficient SOL on devnet (`solana airdrop 5`)
#
# Usage:
#   cd packages/solana-program
#   bash scripts/deploy-devnet.sh

set -euo pipefail

PROGRAM_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROGRAM_ID="E53zfNo9DYxAUCu37bA2NakJMMbzPFszjgB5kPaTMvF3"

echo "═══════════════════════════════════════"
echo "PincerPay Anchor Deploy (devnet)"
echo "═══════════════════════════════════════"
echo ""

# Verify toolchain
echo "Checking toolchain..."
anchor --version || { echo "ERROR: anchor not found. Install: cargo install --git https://github.com/coral-xyz/anchor anchor-cli"; exit 1; }
solana --version || { echo "ERROR: solana not found."; exit 1; }

# Verify devnet config
CLUSTER=$(solana config get | grep "RPC URL" | awk '{print $NF}')
if [[ "$CLUSTER" != *"devnet"* ]]; then
  echo "WARNING: Solana CLI not pointed at devnet. Current: $CLUSTER"
  echo "Setting to devnet..."
  solana config set --url https://api.devnet.solana.com
fi

AUTHORITY=$(solana address)
echo "Authority: $AUTHORITY"
echo "Program:   $PROGRAM_ID"
echo ""

# Check balance
BALANCE=$(solana balance | awk '{print $1}')
echo "Balance: $BALANCE SOL"
if (( $(echo "$BALANCE < 2" | bc -l) )); then
  echo "Low balance — requesting airdrop..."
  solana airdrop 5 || echo "Airdrop failed (rate limited). Ensure you have >= 2 SOL."
fi

# ─── Step 1: Build ───
echo ""
echo "[1/3] Building Anchor program..."
cd "$PROGRAM_DIR"
anchor build

echo ""
echo "Build artifacts:"
ls -lh target/deploy/pincerpay_facilitator.so

# Verify program ID in built keypair matches expected
BUILT_ID=$(solana address -k target/deploy/pincerpay_facilitator-keypair.json 2>/dev/null || echo "unknown")
if [[ "$BUILT_ID" != "$PROGRAM_ID" ]]; then
  echo "WARNING: Built keypair ID ($BUILT_ID) != expected ($PROGRAM_ID)"
  echo "If this is a fresh deploy, update PROGRAM_ID in lib.rs and Anchor.toml"
fi

# ─── Step 2: Deploy ───
echo ""
echo "[2/3] Deploying to devnet..."
anchor deploy --provider.cluster devnet

echo "Deploy complete."

# ─── Step 3: Initialize ───
echo ""
echo "[3/3] Initializing program (fee_bps=100, fee vault ATA, test merchant)..."
echo "Run the init script from Windows/WSL2:"
echo ""
echo "  node scripts/init-program.mjs"
echo ""
echo "Or if @solana/web3.js is not installed locally:"
echo "  cd /tmp && mkdir -p anchor-init && cd anchor-init"
echo "  npm install @solana/web3.js"
echo "  cd $PROGRAM_DIR && node scripts/init-program.mjs"
echo ""
echo "═══════════════════════════════════════"
echo "Deploy finished. Run init-program.mjs to complete setup."
echo "═══════════════════════════════════════"
