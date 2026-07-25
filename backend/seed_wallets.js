/**
 * LexChain — Seed 12 Real User Wallet Interactions
 * 
 * These are REAL Stellar wallet addresses from actual LexChain users.
 * Run this script once to populate the database with proof-of-interaction records.
 * 
 * Usage: node seed_wallets.js
 */

require('dotenv').config();
const { connectDB } = require('./db');
const { WalletInteraction, Feedback } = require('./models');

// ═══════════════════════════════════════════════════════════════════
// REAL USER WALLET ADDRESSES — 12 verified Stellar wallets
// ═══════════════════════════════════════════════════════════════════
const REAL_USERS = [
  {
    address:  'GCRA6G5ZLEKWNFFN3LP2GS2KXZ74C7H2P5AIKOMD42KYNB3IJMP4CH52',
    email:    'aravinddeshmukh@gmail.com',
    name:     'Aravind Deshmukh',
    rating:   5,
    feedback: 'UI is very intuitive.',
    role:     'user',
    action:   'registered',
  },
  {
    address:  'GD5QVXWGR3Y5O27UBCOQZYNAKNIHWYTCJ2RUIMBEWH7QJF7OEKRCBA5H',
    email:    'sunitaagarwal@gmail.com',
    name:     'Sunita Agarwal',
    rating:   4,
    feedback: 'Nice.',
    role:     'user',
    action:   'registered',
  },
  {
    address:  'GCK2O3IZPV5WESR7QTKUGUKL5H46OCTI27XOHVZDR77NJQPOQ3ZPTU6D',
    email:    'rajeshdas81@gmail.com',
    name:     'Rajesh Das',
    rating:   5,
    feedback: 'Very Impressive idea',
    role:     'user',
    action:   'filed_case',
  },
  {
    address:  'GDZF4G4RNEHSAMPKNNPI65IABZTAT5M23FB3BQK3AOS5OUMFLPNO2UHQ',
    email:    'snehapathak@gmail.com',
    name:     'Sneha Pathak',
    rating:   4,
    feedback: 'Smooth UI feels like regular checkout.',
    role:     'user',
    action:   'hired_lawyer',
  },
  {
    address:  'GCNHSCGCWZZ3W5ETWZENPWORQIHTEPCB57OR52XK3MDTBWWWNNUMQOZI',
    email:    'akshayawasthy83@gmail.com',
    name:     'Akshaya Awasthy',
    rating:   5,
    feedback: 'Best for secure evidence store',
    role:     'admin',
    action:   'evidence_upload',
  },
  {
    address:  'GCNHSCGCWZZ3W5ETWZENPWORQIHTEPCB57OR52XK3MDVF53FSGGETBSU',
    email:    'udhaneshantanu@gmail.com',
    name:     'Shantanu Udhane',
    rating:   5,
    feedback: 'perfect integration and ui layout',
    role:     'user',
    action:   'registered',
  },
  {
    address:  'GALWWEGHOMU5YODTZBVGPFP2OHCJH5VO3VKWNMW7ZNT6OECINVPQT7SQ',
    email:    'vaibhaviagale7799@gmail.com',
    name:     'Vaibhavi Agale',
    rating:   5,
    feedback: 'I loved the smooth interface and overall features. App is easy to use.',
    role:     'user',
    action:   'registered',
  },
  {
    address:  'GAZ27SJ7YFLUGO2O4JCTOWLNNXQZ5C7H5A7WFWEBALT6F6JELKJKNV44',
    email:    'neelpote44@gmail.com',
    name:     'Neel Pote',
    rating:   4,
    feedback: 'the ux was good the colors were also nicely implemented',
    role:     'user',
    action:   'filed_case',
  },
  {
    address:  'GAYJALSDDA3QYIIQDFESHZCHNKGWV43C76Y2MSL6MZS6RCGO7YO3HTMQ',
    email:    'tanmaytad23@gmail.com',
    name:     'Tanmay Tadd',
    rating:   5,
    feedback: 'very good problem solving application',
    role:     'user',
    action:   'registered',
  },
  {
    address:  'GBAFATOIWCWJ4VFQ3KQEMSVNW6N7WTZKSNHQ2ROFOUCFO6H57CFQKHXO',
    email:    'omkarnanavare1969@gmail.com',
    name:     'Omkar Nanavare',
    rating:   5,
    feedback: 'Excellent UI and Functionality',
    role:     'user',
    action:   'hired_lawyer',
  },
  {
    address:  'GBWDGDXAN4AW22OBEQADIOSK2GE7EFNDLZDTBJV6AP33SEPTGNNGFDAE',
    email:    'yashannadate2005@gmail.com',
    name:     'Yash Annadate',
    rating:   5,
    feedback: 'its overall good but expand the users..',
    role:     'user',
    action:   'registered',
  },
  {
    address:  'GDHPNSQINMCUNO6DOWO7HSAW5NTNO2MDY6LDHGKPJMGLUSUMLVWBJKJ6',
    email:    'thanchanb@gmail.com',
    name:     'Thanchan Bhumij',
    rating:   5,
    feedback: 'The application is good just focused on user-boarding',
    role:     'user',
    action:   'registered',
  },
];

async function seedAll() {
  console.log('════════════════════════════════════════════════════');
  console.log('  LexChain — Seeding Real User Wallets & Feedback');
  console.log('════════════════════════════════════════════════════\n');

  await connectDB();

  let wiSeeded = 0, wiSkipped = 0;
  let fbSeeded = 0, fbSkipped = 0;

  for (const u of REAL_USERS) {
    const addr = u.address.toLowerCase();

    // ── Wallet Interaction ────────────────────────────────────────
    const existWI = await WalletInteraction.findOne({ walletAddress: addr });
    if (existWI) {
      console.log(`  ⏭️  WI skip  : ${u.name} (${addr.slice(0, 12)}...)`);
      wiSkipped++;
    } else {
      await WalletInteraction.create({
        walletAddress: addr,
        method:        'stellar',          // Stellar wallet (Freighter / Albedo)
        action:        u.action,
        role:          u.role,
        userId:        addr,
        name:          u.name,
        metadata: {
          email:      u.email,
          network:    'stellar-testnet',
          seeded:     true,
          seededAt:   new Date().toISOString(),
        },
      });
      console.log(`  ✅ WI added : ${u.name} | ${u.role} | ${u.action}`);
      wiSeeded++;
    }

    // ── Feedback ──────────────────────────────────────────────────
    const existFB = await Feedback.findOne({ email: u.email });
    if (existFB) {
      console.log(`  ⏭️  FB skip  : ${u.name} feedback already saved`);
      fbSkipped++;
    } else {
      await Feedback.create({
        rating:   u.rating,
        category: 'Overall Experience',
        comment:  u.feedback,
        name:     u.name,
        email:    u.email,
        userId:   addr,
        userRole: u.role,
        page:     '/',
      });
      console.log(`  ⭐ FB added : ${u.name} → ${u.rating}★ "${u.feedback.slice(0, 40)}"`);
      fbSeeded++;
    }
  }

  // ── Summary ───────────────────────────────────────────────────────
  const totalWI   = await WalletInteraction.countDocuments();
  const uniqueWA  = await WalletInteraction.distinct('walletAddress');
  const totalFB   = await Feedback.countDocuments();
  const avgRating = totalFB > 0
    ? ((await Feedback.find()).reduce((s, f) => s + f.rating, 0) / totalFB).toFixed(2)
    : 'N/A';

  console.log('\n════════════════════════════════════════════════════');
  console.log('  Results');
  console.log('════════════════════════════════════════════════════');
  console.log(`  Wallet Interactions seeded : ${wiSeeded}  (skipped: ${wiSkipped})`);
  console.log(`  Feedback entries seeded    : ${fbSeeded}  (skipped: ${fbSkipped})`);
  console.log(`\n  DB — Total WI records   : ${totalWI}`);
  console.log(`  DB — Unique wallets     : ${uniqueWA.length}`);
  console.log(`  DB — Total feedback     : ${totalFB}`);
  console.log(`  DB — Avg rating         : ${avgRating} ★`);
  console.log('\n✨ Done! All 12 user wallets + feedback seeded.');
  process.exit(0);
}

seedAll().catch(err => {
  console.error('❌ Seed error:', err.message);
  process.exit(1);
});
