# LexChain — System Architecture

## Overview

LexChain is a blockchain-anchored legal evidence management system built for the Indian judiciary. It enables tamper-proof evidence submission, real-time chain-of-custody tracking, and decentralized verification via Stellar testnet and IPFS.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│   React + Vite Frontend (Vercel CDN)                            │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│   │  Login/  │ │  User    │ │  Lawyer  │ │  Court / Admin   │  │
│   │ Register │ │Dashboard │ │Dashboard │ │   Dashboard      │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│           │             │              │          │              │
│           └─────────────┴──────────────┴──────────┘             │
│                              │ REST API (JWT)                   │
└──────────────────────────────┼──────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼──────────────────────────────────┐
│                     BACKEND (Node.js / Express)                  │
│                    Hosted on Vercel Serverless                   │
│                                                                 │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────────────┐  │
│  │  Auth       │  │  Evidence  │  │  Cases / Hearings /      │  │
│  │  Middleware │  │  Routes    │  │  Court Orders / Lawyers  │  │
│  │  (JWT/RBAC) │  │            │  │  Access Requests         │  │
│  └─────────────┘  └────────────┘  └──────────────────────────┘  │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────────────┐  │
│  │  Rate       │  │  Input     │  │  Wallet Interactions /   │  │
│  │  Limiter    │  │  Validator │  │  Feedback Tracking       │  │
│  └─────────────┘  └────────────┘  └──────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    LexDB (SQLite via better-sqlite3)      │   │
│  │  Collections: Evidence, Users, Lawyers, Cases, Hearings, │   │
│  │  CourtOrders, AccessRequests, LawyerRatings, Feedback,   │   │
│  │  WalletInteractions                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
         ┌─────────────────────┴─────────────────────┐
         │                                           │
┌────────▼────────┐                       ┌──────────▼──────────┐
│  IPFS via       │                       │  Stellar Testnet    │
│  Pinata API     │                       │  (Blockchain Anchor)│
│                 │                       │                     │
│  File storage   │                       │  EvidenceAnchor     │
│  Metadata pins  │                       │  Soroban Contract   │
│  CID returned   │                       │  TX Hash stored in  │
│  for each file  │                       │  Evidence record    │
└─────────────────┘                       └─────────────────────┘
```

---

## Data Flow: Evidence Submission

```
User Uploads File
      │
      ▼
POST /api/evidence (multipart/form-data)
      │
      ├─► SHA-256 hash computed from file bytes
      │
      ├─► File pinned to IPFS via Pinata → returns CID
      │
      ├─► Evidence record created in LexDB
      │       { id, hash, ipfsCid, status: 'verified', chainOfCustody[] }
      │
      ├─► Response sent to client (non-blocking anchoring)
      │
      └─► Stellar anchoring (async, with retry)
              │
              ├─► anchorWithRetry() → up to 3 attempts (exponential backoff)
              │
              ├─► On success: stellarTxHash written back to Evidence record
              │              chain-of-custody entry added
              │
              └─► On all failures: item queued for background retry (60s later)
```

---

## Authentication & Authorization

| Route Type         | Auth Required | Roles                  |
|--------------------|---------------|------------------------|
| POST /api/auth/*   | No (public)   | —                      |
| GET /api/evidence  | No (public)   | —                      |
| GET /api/cases     | Optional      | user, lawyer, judge    |
| PATCH /api/cases/* | Required      | user, lawyer, judge    |
| POST /api/evidence | Required      | admin, police          |
| PATCH /api/evidence/:id/approval | Required | judge        |
| GET /api/stellar/queue | Required  | admin, judge           |
| GET /api/users     | Required      | admin                  |

**Token flow:**
1. User logs in → server signs JWT (7-day expiry)  
2. Client stores token in `localStorage`  
3. Subsequent requests include `Authorization: Bearer <token>`  
4. `requireAuth` middleware verifies + decodes, attaches `req.user`  
5. `requireRole(...roles)` enforces RBAC on sensitive routes

---

## Key Design Decisions

### 1. Embedded SQLite (LexDB) over MongoDB
MongoDB required a remote connection that was unreliable on Vercel's serverless cold-start. LexDB wraps SQLite with a Mongoose-compatible API, enabling zero-config deployment without external database dependencies.

### 2. Non-blocking Stellar Anchoring
Evidence uploads return immediately after IPFS pinning. Stellar anchoring happens asynchronously so that a Stellar network slowdown never blocks the user. Failed anchors are retried with exponential backoff and a 60-second background queue.

### 3. In-memory Rate Limiting
No Redis dependency. A sliding window counter per `{IP:route}` key is stored in a `Map`. A scheduled cleanup interval prevents memory leaks. Limits: 10 auth req/15min, 30 evidence uploads/15min, 200 general/15min.

### 4. Role-based Dashboards
Each user role (citizen, lawyer, judge, admin) gets a separate React page. The backend enforces the same roles via JWT — the frontend restrictions are UX only.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `ADMIN_PASSCODE` | Yes | Passcode for admin registration |
| `JUDGE_PASSCODE` | Yes | Passcode for judge registration |
| `PINATA_JWT` | Yes (or API keys) | Pinata JWT for IPFS uploads |
| `PINATA_API_KEY` | Alt | Pinata API key (legacy auth) |
| `PINATA_SECRET_API_KEY` | Alt | Pinata secret (legacy auth) |
| `PINATA_GATEWAY_TOKEN` | No | Token for private gateway access |
| `STELLAR_SECRET_KEY` | Yes | Stellar account for anchoring |
| `PORT` | No | Server port (default: 3001) |

---

## Deployment Architecture

```
GitHub (main branch)
    │
    ├─► Vercel (automatic deployment)
    │       ├─► /api/* → backend/server.js (serverless function)
    │       └─► /* → frontend/dist (static CDN)
    │
    └─► GitHub Actions CI
            ├─► Backend syntax check
            ├─► Frontend production build
            └─► npm security audit
```

**Live URLs:**
- Frontend: https://lexchain.vercel.app  
- Backend API: https://lexchain-backend.vercel.app  
- Stellar Explorer: https://stellar.expert/explorer/testnet

---

## Stellar Smart Contract

**Contract ID:** `CBIELTK6YBZJU5UP2WWQEQ4YKR525RABARNZHRBIG4DPXNYGZFKC75YA`  
**Network:** Stellar Testnet  
**Language:** Rust (Soroban)  
**Source:** `contracts/evidence-anchor/`

The contract exposes a single `anchor_evidence(evidence_id, hash, ipfs_cid)` function that writes an immutable record to the contract's persistent storage. The backend calls this after every successful IPFS upload.
