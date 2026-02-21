#!/bin/bash
set -euo pipefail

exec kora \
  --config /app/kora.toml \
  --rpc-url "${RPC_URL:-https://api.devnet.solana.com}" \
  rpc start \
  --signers-config /app/signers.toml
