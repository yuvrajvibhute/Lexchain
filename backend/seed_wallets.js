/**
 * LexChain — Seed 13 User Wallet Interactions
 * 
 * Run this script ONCE to pre-populate the database with the 13 known user wallet addresses.
 * These wallet addresses represent real users who have interacted with LexChain.
 * 
 * Usage: node seed_wallets.js
 * 
 * REPLACE the wallet addresses below with the actual 13 wallets provided by the project owner.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./db');
const { WalletInteraction, User } = require('./models');

// ═══════════════════════════════════════════════════════════════════
// REPLACE THESE WITH THE 13 ACTUAL WALLET ADDRESSES
// The user said they will provide 13 wallet addresses
// ═══════════════════════════════════════════════════════════════════
const KNOWN_USER_WALLETS = [
  // Format: { address, name, role, action, note }
  // PLACEHOLDER — replace with actual addresses provided by user
  { address: '0xUSER_WALLET_ADDRESS_1', name: 'User 1', role: 'user',  action: 'registered',       note: 'Registered as citizen on LexChain' },
  { address: '0xUSER_WALLET_ADDRESS_2', name: 'User 2', role: 'user',  action: 'registered',       note: 'Filed a case using wallet auth' },
  { address: '0xUSER_WALLET_ADDRESS_3', name: 'User 3', role: 'admin', action: 'registered',       note: 'Police admin — uploaded evidence' },
  { address: '0xUSER_WALLET_ADDRESS_4', name: 'User 4', role: 'user',  action: 'hired_lawyer',     note: 'Connected wallet and hired a lawyer' },
  { address: '0xUSER_WALLET_ADDRESS_5', name: 'User 5', role: 'lawyer',action: 'registered',       note: 'Lawyer registration with wallet' },
  { address: '0xUSER_WALLET_ADDRESS_6', name: 'User 6', role: 'user',  action: 'filed_case',       note: 'Wallet-authenticated case filing' },
  { address: '0xUSER_WALLET_ADDRESS_7', name: 'User 7', role: 'judge', action: 'registered',       note: 'Court judge dashboard login' },
  { address: '0xUSER_WALLET_ADDRESS_8', name: 'User 8', role: 'user',  action: 'approved_access',  note: 'User approved admin access request' },
  { address: '0xUSER_WALLET_ADDRESS_9', name: 'User 9', role: 'admin', action: 'evidence_upload',  note: 'Evidence anchored on IPFS via wallet' },
  { address: '0xUSER_WALLET_ADDRESS_10',name: 'User 10',role: 'user',  action: 'registered',       note: 'New citizen onboarded to platform' },
  { address: '0xUSER_WALLET_ADDRESS_11',name: 'User 11',role: 'lawyer',action: 'case_assigned',    note: 'Lawyer accepted case assignment' },
  { address: '0xUSER_WALLET_ADDRESS_12',name: 'User 12',role: 'user',  action: 'rated_lawyer',     note: 'Submitted lawyer rating via wallet' },
  { address: '0xUSER_WALLET_ADDRESS_13',name: 'User 13',role: 'admin', action: 'verified_lawyer',  note: 'Admin verified lawyer credentials' },
];

async function seedWallets() {
  console.log('🔗 LexChain — Seeding 13 User Wallet Interactions...\n');
  
  await connectDB();
  
  let seeded = 0;
  let skipped = 0;
  
  for (const w of KNOWN_USER_WALLETS) {
    const addr = w.address.toLowerCase();
    
    // Check if already seeded
    const existing = await WalletInteraction.findOne({ walletAddress: addr, action: w.action });
    if (existing) {
      console.log(`  ⏭️  Skipping ${addr} (${w.action}) — already recorded`);
      skipped++;
      continue;
    }
    
    // Record wallet interaction
    await WalletInteraction.create({
      walletAddress: addr,
      method: 'metamask',
      action: w.action,
      role: w.role,
      userId: addr,
      name: w.name,
      metadata: { 
        seeded: true,
        note: w.note,
        network: 'ethereum',
        seededAt: new Date().toISOString(),
      },
    });
    
    console.log(`  ✅ Seeded: ${addr} | ${w.name} | ${w.role} | ${w.action}`);
    seeded++;
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Seeded: ${seeded} interactions`);
  console.log(`   Skipped: ${skipped} (already existed)`);
  
  const total = await WalletInteraction.countDocuments();
  const unique = await WalletInteraction.distinct('walletAddress');
  
  console.log(`\n📈 Database State:`);
  console.log(`   Total interactions: ${total}`);
  console.log(`   Unique wallets: ${unique.length}`);
  
  console.log('\n✨ Done! Run: node server.js to start the server.');
  process.exit(0);
}

seedWallets().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
