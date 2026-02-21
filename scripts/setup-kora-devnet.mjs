#!/usr/bin/env node

/**
 * Generate a Solana Ed25519 keypair for the Kora fee payer signer.
 * No external dependencies — uses Node.js built-in crypto.
 *
 * Usage: node scripts/setup-kora-devnet.mjs
 */

import { generateKeyPairSync, createPublicKey } from "node:crypto";

// Base58 alphabet (Bitcoin/Solana)
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase58(bytes) {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  // Leading zeros
  let output = "";
  for (const byte of bytes) {
    if (byte === 0) output += ALPHABET[0];
    else break;
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    output += ALPHABET[digits[i]];
  }
  return output;
}

// Generate Ed25519 keypair
const { publicKey, privateKey } = generateKeyPairSync("ed25519");

// Export raw keys
const pubRaw = publicKey.export({ type: "spki", format: "der" });
const privRaw = privateKey.export({ type: "pkcs8", format: "der" });

// Ed25519 SPKI DER has 12-byte prefix, raw public key is last 32 bytes
const pubBytes = pubRaw.subarray(pubRaw.length - 32);
// Ed25519 PKCS8 DER has 16-byte prefix, raw private key seed is last 32 bytes
const privSeed = privRaw.subarray(privRaw.length - 32);

// Solana keypair format: 64 bytes = [32-byte private seed | 32-byte public key]
const keypair = Buffer.concat([privSeed, pubBytes]);

const pubBase58 = encodeBase58(pubBytes);
const keypairBase58 = encodeBase58(keypair);

console.log("=== Kora Fee Payer Keypair (Solana devnet) ===\n");
console.log(`Public Key:  ${pubBase58}`);
console.log(`Keypair:     ${keypairBase58}\n`);
console.log("--- Railway Environment Variables ---\n");
console.log(`KORA_SIGNER_PRIVATE_KEY=${keypairBase58}\n`);
console.log("--- Next Steps ---\n");
console.log(`1. Fund with SOL (fee payer needs SOL for transaction fees):`);
console.log(`   solana airdrop 5 ${pubBase58} --url devnet\n`);
console.log(`2. Get devnet USDC from Circle's faucet:`);
console.log(`   https://faucet.circle.com/ (select Solana devnet)\n`);
console.log(`3. Deploy Kora on Railway:`);
console.log(`   - Create service from infra/kora/ directory`);
console.log(`   - Set KORA_SIGNER_PRIVATE_KEY env var (above)`);
console.log(`   - Set RPC_URL=https://api.devnet.solana.com\n`);
console.log(`4. Update facilitator env vars:`);
console.log(`   - KORA_RPC_URL=http://kora.railway.internal:8080`);
console.log(`   - Remove SOLANA_PRIVATE_KEY (Kora replaces it)\n`);
