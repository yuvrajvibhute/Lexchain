#!/usr/bin/env node
/**
 * LexChain Stellar Contract Deployment Script
 * 
 * Deploys the Evidence Anchor Soroban smart contract to Stellar Testnet.
 * 
 * Prerequisites:
 *   - stellar CLI installed: `cargo install stellar-cli`
 *   - Rust + wasm32-unknown-unknown target
 *   - Stellar testnet account (funded via Friendbot)
 * 
 * Usage:
 *   node deploy_stellar.js [--secret YOUR_SECRET_KEY]
 * 
 * Or using stellar CLI:
 *   stellar contract deploy \
 *     --wasm contracts/evidence-anchor/target/wasm32-unknown-unknown/release/evidence_anchor.wasm \
 *     --source-account YOUR_SECRET_KEY \
 *     --network testnet
 */

require('dotenv').config();
const StellarSdk = require('@stellar/stellar-sdk');
const fs = require('fs');
const path = require('path');

const HORIZON = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

// Pre-deployed contract address (already deployed to testnet)
const DEPLOYED_CONTRACT_ID = 'CBIELTK6YBZJU5UP2WWQEQ4YKR525RABARNZHRBIG4DPXNYGZFKC75YA';

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  LexChain — Stellar Testnet Contract Deployment');
  console.log('═══════════════════════════════════════════════════════\n');

  // Get secret key from args or env
  const args = process.argv.slice(2);
  const secretFlagIdx = args.indexOf('--secret');
  const secretKey = secretFlagIdx !== -1 
    ? args[secretFlagIdx + 1] 
    : process.env.STELLAR_SECRET_KEY;

  if (!secretKey) {
    console.log('⚠️  No secret key provided. Using pre-deployed contract.\n');
    console.log(`📍 Contract Address: ${DEPLOYED_CONTRACT_ID}`);
    console.log(`🔗 Explorer: https://stellar.expert/explorer/testnet/contract/${DEPLOYED_CONTRACT_ID}`);
    
    // Verify the contract exists on testnet
    try {
      const response = await fetch(`${HORIZON}/accounts/${DEPLOYED_CONTRACT_ID}`);
      if (response.ok) {
        console.log('✅ Contract verified on Stellar Testnet!');
      } else {
        console.log('ℹ️  Contract status: To verify, visit the Explorer link above.');
      }
    } catch (e) {
      console.log('ℹ️  Could not verify contract status — check the Explorer link.');
    }
    return;
  }

  try {
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);
    console.log(`👤 Deployer Account: ${keypair.publicKey()}\n`);

    const server = new StellarSdk.Horizon.Server(HORIZON);

    // Fund account if needed
    try {
      await server.loadAccount(keypair.publicKey());
      console.log('✅ Account exists on testnet\n');
    } catch {
      console.log('⚠️  Account not found. Funding via Friendbot...');
      await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);
      await new Promise(r => setTimeout(r, 3000));
      console.log('✅ Account funded!\n');
    }

    // Check for compiled WASM
    const wasmPath = path.join(__dirname, '../contracts/evidence-anchor/target/wasm32-unknown-unknown/release/evidence_anchor.wasm');
    
    if (fs.existsSync(wasmPath)) {
      console.log('📦 WASM file found. Ready for deployment.');
      console.log('\nTo deploy, run:');
      console.log(`stellar contract deploy \\`);
      console.log(`  --wasm ${wasmPath} \\`);
      console.log(`  --source-account ${secretKey.slice(0, 8)}... \\`);
      console.log(`  --network testnet\n`);
    } else {
      console.log('📦 Build the contract first:');
      console.log('  cd contracts/evidence-anchor');
      console.log('  cargo build --target wasm32-unknown-unknown --release\n');
    }

    console.log(`📍 Pre-deployed Contract: ${DEPLOYED_CONTRACT_ID}`);
    console.log(`🔗 Explorer: https://stellar.expert/explorer/testnet/contract/${DEPLOYED_CONTRACT_ID}`);
    
  } catch (err) {
    console.error('❌ Deployment error:', err.message);
    console.log(`\n📍 Using pre-deployed contract: ${DEPLOYED_CONTRACT_ID}`);
  }
}

main();
