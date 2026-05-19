# ⚖️ LexChain — Blockchain Court Evidence Ledger

<div align="center">

![LexChain Banner](https://img.shields.io/badge/LexChain-Blockchain%20Evidence%20Platform-d4a017?style=for-the-badge&logo=ethereum&logoColor=white)

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com)
[![Privy](https://img.shields.io/badge/Privy-Wallet%20%26%20Email%20Auth-7c3aed?style=flat-square)](https://privy.io)
[![Wagmi](https://img.shields.io/badge/Wagmi-v2-blue?style=flat-square)](https://wagmi.sh)
[![Local-First](https://img.shields.io/badge/Platform-Local%20First%20%2F%20Offline%20Safe-blueviolet?style=flat-square)](#-running-locally)
[![License](https://img.shields.io/badge/License-ISC-green?style=flat-square)](LICENSE)

**A decentralized, tamper-proof legal evidence management system built on blockchain technology.**

[🔴 Live Demo](#) · [📖 API Docs](#-api-reference) · [🐛 Report Bug](https://github.com/yuvrajvibhute/Lexchain/issues) · [✨ Request Feature](https://github.com/yuvrajvibhute/Lexchain/issues)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [User Roles & Permissions](#-user-roles--permissions)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Frontend Structure](#-frontend-structure)
- [Backend Structure](#-backend-structure)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Wallet Authentication](#-wallet-authentication)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Overview

**LexChain** is a full-stack, blockchain-backed legal evidence management platform designed for Indian courts and law enforcement. It provides an immutable, verifiable chain of custody for digital evidence — from initial police upload through court admission and final verdict.

Every piece of evidence submitted generates a **cryptographic SHA-256 hash**, a **simulated blockchain transaction hash**, an **IPFS CID**, and a **block height**, ensuring the integrity and traceability of all court records without the possibility of tampering.

> **Problem it solves**: Traditional paper-based and centralized digital evidence systems are prone to tampering, data loss, and lack transparency. LexChain brings cryptographic verifiability and full audit trails to the Indian legal system.

---

## ✨ Key Features

### 🔐 Authentication & Security
- **Multi-Method Login** via [Privy](https://privy.io) supporting **Web3 Wallets** (MetaMask, Coinbase, WalletConnect) and **Web2 Email OTP** (One-Time Passcode)
- **Automatic Embedded Wallet Provisioning**: Email-login users automatically receive a secure, fully-featured cryptographic Ethereum wallet in the background
- **Strict Role-Guard Verification**: Real-time server-side checking guarantees that connected wallets/emails strictly match their registered role on the selected login tab (e.g. users cannot log in via the Judge dashboard using a Citizen wallet)
- Role-based access control with passcodes for privileged roles (Admin, Judge)
- JWT token-based session management
- Secure admin passcode: `NYAYA2024` | Judge passcode: `JUDGE2024`

### 📂 Evidence Management
- **Pinata IPFS Storage**: Uploaded files are uploaded to real, permanent, decentralized IPFS storage using custom Pinata integrations
- Automatic cryptographic SHA-256 file hashing
- Immutable chain-of-custody tracking per evidence item
- Court approval workflow (pending → approved/rejected)
- Evidence verification by ID, hash, or transaction hash

### ⚖️ Case Management
- File new cases with full incident details
- Unique case ID generation (`LCX-YYYY-XXXX` format)
- Case status lifecycle: `filed` → `lawyer_assigned` → `judgement_issued` → `closed`
- Assign lawyers and judges to cases
- Case detail view with all related hearings, evidence, and court orders

### 👨‍⚖️ Role-Based Dashboards
| Role | Dashboard | Key Actions |
|------|-----------|-------------|
| **User (Citizen)** | `/dashboard` | File cases, hire lawyers, view hearings |
| **Admin (Police)** | `/admin` | Upload evidence, manage access requests, verify users |
| **Lawyer** | `/lawyer` | View assigned cases, manage hearings, access case files |
| **Judge** | `/court` | Review cases, schedule hearings, issue court orders |

### 📅 Hearing Scheduler
- Schedule hearings with date, time, and venue
- Associate hearings with specific cases
- Judge and lawyer hearing views filtered by role

### 📜 Court Orders
- Issue court orders from the Judge dashboard
- Orders are hashed (SHA-256) and anchored to a blockchain record
- Verdict options automatically update case status

### 🧑‍💼 Lawyer Directory
- Browse and filter lawyers by specialization, city, experience, and fee
- Rate and review lawyers (aggregated rating system)
- Admin can verify/unverify lawyer profiles
- Hire a lawyer directly from a case

### 📋 Access Request System
- Admin can request access to a user's evidence
- Users approve or deny access requests
- Status tracking: `pending` → `approved` / `rejected`

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI Framework |
| **Vite** | 7.x | Build Tool & Dev Server |
| **React Router DOM** | 7.x | Client-Side Routing |
| **Privy React Auth** | 3.x | Wallet Authentication |
| **Wagmi** | 2.x | EVM Wallet Hooks |
| **RainbowKit** | 2.x | Wallet Connect UI |
| **TanStack Query** | 5.x | Server State Management |
| **Vanilla CSS** | — | Styling (custom design system) |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime |
| **Express** | 5.x | HTTP Framework |
| **Mongoose** | 8.x | MongoDB ODM |
| **MongoDB Memory Server** | 11.x | In-memory DB (dev fallback) |
| **Multer** | 2.x | File Uploads |
| **JSON Web Token** | 9.x | Auth Tokens |
| **crypto** (built-in) | — | Hash Generation |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Local Host** | Fully-optimized for offline/local run without cloud server reliance |
| **MongoDB Memory Server** | Seamless local database fallback that triggers automatically if MongoDB Atlas is disconnected, ensuring 100% stable presentation demos |
| **Pinata IPFS** | Real, decentralized document storage on the IPFS network |

---

## 🏗 Project Architecture

```
lexchain/
├── 📁 backend/                   # Node.js + Express API
│   ├── 📄 server.js              # Main API server (all routes)
│   ├── 📄 models.js              # Mongoose schemas (7 models)
│   ├── 📄 db.js                  # MongoDB connection + seeder
│   ├── 📁 uploads/               # Uploaded evidence files
│   └── 📄 package.json
│
├── 📁 frontend/                   # React + Vite SPA
│   ├── 📁 public/                 # Static assets (logo, favicon)
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   └── 📄 ProtectedRoute.jsx   # Role-based route guard
│   │   ├── 📁 context/
│   │   │   ├── 📄 AuthContext.jsx       # Global auth state (localStorage)
│   │   │   └── 📄 PrivyContext.jsx      # Privy wallet context
│   │   ├── 📁 pages/
│   │   │   ├── 📄 Home.jsx              # Landing page
│   │   │   ├── 📄 Login.jsx             # Multi-role login
│   │   │   ├── 📄 Register.jsx          # Multi-role registration
│   │   │   ├── 📄 UserDashboard.jsx     # Citizen dashboard
│   │   │   ├── 📄 AdminDashboard.jsx    # Police/Admin dashboard
│   │   │   ├── 📄 LawyerDashboard.jsx   # Lawyer dashboard
│   │   │   └── 📄 CourtDashboard.jsx    # Judge/Court dashboard
│   │   ├── 📁 utils/                    # Utility helpers
│   │   ├── 📁 assets/                   # Images and static assets
│   │   ├── 📄 App.jsx                   # Route definitions
│   │   ├── 📄 main.jsx                  # App entry point + providers
│   │   ├── 📄 App.css                   # Global styles
│   │   └── 📄 index.css                 # CSS reset & tokens
│   ├── 📄 index.html
│   ├── 📄 vite.config.js
│   └── 📄 package.json
│
├── 📄 vercel.json                 # Vercel deployment configuration
├── 📄 package.json                # Root scripts (concurrently)
└── 📄 README.md
```

---

## 👥 User Roles & Permissions

LexChain supports **four distinct roles**, each with a dedicated dashboard and a specific set of permissions:

### 👤 User (Citizen / Public)
- Register with name, email, phone, Aadhaar, city & address
- File new legal cases with full incident details
- Browse and hire lawyers from the directory
- View case status and timeline
- Receive and act on evidence access requests from Admin

### 🛡️ Admin (Police Officer / Authority)
- **Special registration passcode required:** `NYAYA2024`
- Upload evidence files with metadata (case no., FIR type, station)
- View and manage all evidence on the platform
- Request access to specific user's evidence
- Verify lawyers and manage user accounts
- View blockchain transaction details for each evidence record

### 🧑‍💼 Lawyer (Advocate)
- Register with Bar Council ID, license number, specialization, court & experience
- View cases assigned to them
- Access all evidence related to their assigned cases
- Schedule and view hearing dates
- Add case notes and updates

### ⚖️ Judge (Judicial Officer)
- **Special registration passcode required:** `JUDGE2024`
- View all cases assigned to them by admin
- Schedule court hearings with venue and date/time
- Approve or reject evidence submitted by police
- Issue digitally-signed court orders with verdict
- Court orders are hashed and stored immutably

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

| Tool | Version | Download |
|------|---------|---------|
| **Node.js** | ≥ 18.x | [nodejs.org](https://nodejs.org) |
| **npm** | ≥ 9.x | Included with Node.js |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |
| **MetaMask** | Latest | [metamask.io](https://metamask.io) *(browser extension)* |

> **Optional:** A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI for production persistence. Without it, the backend uses an in-memory MongoDB instance (data resets on restart).

---

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/yuvrajvibhute/Lexchain.git
cd Lexchain
```

**2. Install root dependencies:**
```bash
npm install
```

**3. Install backend dependencies:**
```bash
cd backend
npm install
cd ..
```

**4. Install frontend dependencies:**
```bash
cd frontend
npm install
cd ..
```

---

### Environment Variables

#### Backend (`backend/.env` — create this file)

```env
# MongoDB connection string (optional — uses in-memory DB if not set)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/lexchain

# JWT secret for signing tokens
JWT_SECRET=nyaya-chain-secret-2024

# Admin registration passcode
VITE_ADMIN_PASSCODE=NYAYA2024

# Judge registration passcode
JUDGE_PASSCODE=JUDGE2024

# Server port (default: 3001)
PORT=3001
```

#### Frontend (`frontend/.env` — already exists)

```env
# Your Privy App ID (sign up at privy.io to get one)
VITE_PRIVY_APP_ID=your_privy_app_id_here

# Backend API base URL
VITE_API_URL=http://localhost:3001
```

> ⚠️ **Never commit `.env` files to version control.** They are already listed in `.gitignore`.

---

### Running Locally

#### Option A — One-Click Automated Launcher (Highly Recommended)
For the most premium presentation experience, we have included a **one-click startup launcher** at the root of the project:
1. Double-click the **`START_DEMO.bat`** file.
2. The launcher will automatically:
   - Terminate any stale processes on port `3001` or `5173` to prevent port-in-use conflicts.
   - Start the backend server on `http://localhost:3001`.
   - Start the frontend developer server on `http://localhost:5173`.
   - Automatically open the platform in your default web browser!

#### Option B — Run Manually with Concurrently
```bash
# From the project root
npm run dev
```
This starts both the backend and frontend simultaneously in your terminal.

#### Option C — Run Individually

**Backend only:**
```bash
cd backend
node server.js
# Backend runs on http://localhost:3001
```

**Frontend only:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

---

**Access details:**

| Service | URL |
|---------|-----|
| Frontend UI | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| API Evidence Health | http://localhost:3001/api/evidence |

---

## 📱 Frontend Structure

### Pages

| Page | Route | Description |
|------|-------|-------------|
| `Home.jsx` | `/` | Landing page with platform overview, features, and stats |
| `Login.jsx` | `/login` | Multi-role login form (User, Admin, Lawyer, Judge) |
| `Register.jsx` | `/register` | Multi-role registration with role-specific fields |
| `UserDashboard.jsx` | `/dashboard` | Citizen's personal legal portal |
| `AdminDashboard.jsx` | `/admin` | Police/admin evidence & case management hub |
| `LawyerDashboard.jsx` | `/lawyer` | Lawyer's case and hearing management |
| `CourtDashboard.jsx` | `/court` | Judge's case review and order issuance portal |

### Key Components

| Component | Purpose |
|-----------|---------|
| `ProtectedRoute.jsx` | Wraps routes with role-based access control |
| `AuthContext.jsx` | Global `user`, `login()`, `logout()` state via React Context + localStorage |
| `PrivyContext.jsx` | Exposes Privy wallet hooks for wallet interaction |

### Routing Logic (`App.jsx`)

```
/           → Home (public)
/login      → Login page (redirects to dashboard if already logged in)
/register   → Register page (redirects to dashboard if already logged in)
/dashboard  → UserDashboard   [role: user only]
/admin      → AdminDashboard  [role: admin only]
/lawyer     → LawyerDashboard [role: lawyer only]
/court      → CourtDashboard  [role: judge only]
/*          → Redirect to Home
```

### Provider Stack (`main.jsx`)

The app is wrapped in the following providers (outermost → innermost):

```
StrictMode
  └── ErrorBoundary (custom class component)
        └── PrivyProvider (wallet auth)
              └── QueryClientProvider (TanStack Query)
                    └── WagmiProvider (EVM hooks)
                          └── RainbowKitProvider (wallet UI)
                                └── BrowserRouter
                                      └── AuthProvider (custom auth state)
                                            └── App (routes)
```

---

## 🔌 Backend Structure

### File Overview

| File | Description |
|------|-------------|
| `server.js` | All Express routes: auth, evidence, cases, hearings, court orders, lawyers, access requests, users |
| `models.js` | All 7 Mongoose schemas and models |
| `db.js` | MongoDB connection logic (Atlas or in-memory fallback) + database seeder |

### Helper Functions

| Function | Description |
|----------|-------------|
| `genCaseId()` | Generates unique case IDs in format `LCX-YYYY-XXXX` |
| `genBlockchainData()` | Simulates blockchain anchor: returns random `txHash`, `blockHeight`, `ipfsCid` |

### Seeded Data

On first startup, if the database is empty, the server seeds:
- **1 evidence record**: A sample FIR document with full chain-of-custody
- **2 lawyers**: Adv. Priya Krishnamurthy (Criminal Law) and Adv. Rahul Sharma (Civil Law)

---

## 📡 API Reference

All endpoints are prefixed with `/api`.

### 🔐 Authentication

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/api/auth/email` | Login/register with email | `name, email, role, passcode?, city, phone, aadhaar` |
| `POST` | `/api/auth/wallet` | Login/register with wallet | `address, signature, message, role, name, passcode?` + lawyer fields |

**Wallet registration additional fields (if `role === 'lawyer'`):**
```json
{
  "barCouncilId": "KAR/2015/3421",
  "licenseNo": "LIC-KA-3421",
  "specialization": "Criminal Law",
  "experience": 12,
  "fee": 5000,
  "courtName": "Karnataka High Court"
}
```

---

### 📂 Evidence

| Method | Endpoint | Description | Params/Body |
|--------|----------|-------------|-------------|
| `GET` | `/api/evidence` | Get all evidence | `?caseId=` (optional filter) |
| `POST` | `/api/evidence` | Upload new evidence | `multipart/form-data`: `file, name, caseNo, caseId, officer, station, type` |
| `GET` | `/api/evidence/verify/:identifier` | Verify by ID, hash, or txHash | `:identifier` = evidence ID / `0x...` hash / txHash |
| `PATCH` | `/api/evidence/:id/approval` | Update court approval status | `{ courtApproval: "approved"|"rejected", judgeName }` |

---

### ⚖️ Cases

| Method | Endpoint | Description | Params/Body |
|--------|----------|-------------|-------------|
| `POST` | `/api/cases` | File a new case | `title, category, description, location, incidentDate, opponentName, filedBy, filedByName` |
| `GET` | `/api/cases` | List cases (role-filtered) | `?userId=&role=user` / `?lawyerId=&role=lawyer` / `?judgeId=&role=judge` |
| `GET` | `/api/cases/:id` | Get case details with hearings, evidence, orders | `:id` = case ID |
| `PATCH` | `/api/cases/:id` | Update case (status, assignment) | Any case fields |
| `POST` | `/api/cases/:id/hire-lawyer` | Assign lawyer to case | `{ lawyerId, lawyerName }` |

**Case Status Lifecycle:**
```
filed → lawyer_assigned → judgement_issued → closed
```

---

### 📅 Hearings

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/api/hearings` | Schedule a hearing | `caseId, caseTitle, hearingDate, hearingTime, venue, notes, scheduledBy, scheduledByName` |
| `GET` | `/api/hearings` | Get hearings | `?caseId=` (optional filter) |

---

### 📜 Court Orders

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/api/court-orders` | Issue a court order | `caseId, caseTitle, judgeId, judgeName, orderText, verdict` |

> Court orders are automatically hashed (SHA-256) and anchored with a simulated blockchain tx.  
> If `verdict === 'closed'`, the case status is set to `closed`; otherwise `judgement_issued`.

---

### 🧑‍💼 Lawyers

| Method | Endpoint | Description | Params/Body |
|--------|----------|-------------|-------------|
| `GET` | `/api/lawyers` | List lawyers (filterable) | `?specialization=&city=&minExp=&maxFee=&verified=1` |
| `GET` | `/api/lawyers/:id` | Get lawyer profile | `:id` = lawyer ID |
| `PATCH` | `/api/lawyers/:id/verify` | Admin: verify/unverify a lawyer | `{ verified: true/false }` |
| `POST` | `/api/lawyers/:id/rate` | Rate a lawyer | `{ userId, rating, review }` |

---

### 📋 Access Requests

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/api/access-requests` | Create an access request | `{ evidenceId, adminId, adminName, targetUserId, targetUserName }` |
| `GET` | `/api/access-requests` | Get requests | `?adminId=` or `?userId=` |
| `PATCH` | `/api/access-requests/:id` | Update request status | `{ status: "approved"|"rejected" }` |

---

### 👤 Users

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| `GET` | `/api/users` | List users (admin use) | `?search=name_or_email` |

---

## 🗄 Database Schema

LexChain uses **7 MongoDB collections** managed via Mongoose:

### Evidence
```javascript
{
  id: String (unique),          // "EV-2024-0012"
  name: String,                 // File name
  type: String,                 // "FIR", "Document", etc.
  hash: String (unique),        // "0x7f3a9c2e..."
  ipfsCid: String,              // "QmX9bK2n..."
  uploadedBy: String,           // Officer name
  station: String,              // Police station
  caseNo: String,               // FIR/case number
  caseId: String,               // LCX case ID reference
  timestamp: Date,
  blockHeight: Number,          // Simulated block height
  txHash: String,               // Simulated tx hash
  status: String,               // "verified"
  courtApproval: String,        // "pending" | "approved" | "rejected"
  chainOfCustody: [{
    officer: String,
    action: String,
    time: Date
  }]
}
```

### User
```javascript
{
  id: String (unique),          // Wallet address OR email hash
  name: String,
  email: String,
  address: String,              // Wallet address
  role: String,                 // "user" | "admin" | "lawyer" | "judge"
  loginMethod: String,          // "wallet" | "email"
  city: String,
  post: String,
  phone: String,
  aadhaar: String,
  fullAddress: String
}
```

### Lawyer
```javascript
{
  id: String (unique),          // Wallet address
  userId: String,
  name: String,
  email: String,
  barCouncilId: String,
  licenseNo: String,
  specialization: String,
  experience: Number,           // Years
  fee: Number,                  // Per consultation (₹)
  rating: Number,               // Avg rating (0-5)
  ratingCount: Number,
  courtName: String,
  city: String,
  phone: String,
  bio: String,
  verified: Boolean             // Admin-verified
}
```

### Case
```javascript
{
  id: String (unique),          // "LCX-2024-1234"
  title: String,
  category: String,             // "Criminal" | "Civil" | "Family" | etc.
  description: String,
  location: String,
  incidentDate: String,
  opponentName: String,
  opponentContact: String,
  filedBy: String,              // User ID
  filedByName: String,
  assignedLawyer: String,       // Lawyer ID
  assignedLawyerName: String,
  assignedJudge: String,        // Judge ID
  assignedJudgeName: String,
  status: String                // "filed" | "lawyer_assigned" | "judgement_issued" | "closed"
}
```

### Hearing
```javascript
{
  caseId: String,
  caseTitle: String,
  hearingDate: String,
  hearingTime: String,
  venue: String,
  notes: String,
  scheduledBy: String,
  scheduledByName: String
}
```

### CourtOrder
```javascript
{
  caseId: String,
  caseTitle: String,
  judgeId: String,
  judgeName: String,
  orderText: String,
  verdict: String,
  hash: String,                 // SHA-256 of orderText
  txHash: String,               // Simulated blockchain tx
  blockHeight: Number
}
```

### AccessRequest
```javascript
{
  evidenceId: String,
  adminId: String,
  adminName: String,
  targetUserName: String,
  targetUserId: String,
  status: String                // "pending" | "approved" | "rejected"
}
```

---

## 🔑 Wallet & Email Authentication

LexChain uses **[Privy](https://privy.io)** for multi-modal, secure authentication:

1. **Web3 Wallets**: Connect with MetaMask, Coinbase Wallet, or WalletConnect. The frontend performs standard message signing to prove wallet ownership.
2. **Web2 Email OTP**: Type your email address to receive an instant verification OTP.
3. **Embedded Wallet**: Upon successful email validation, Privy automatically generates a secure, fully-functioning cryptographic Ethereum wallet in the background for the user, requiring zero MetaMask setup!
4. **Strict Authentication Guarding**: When registering or logging in, the backend strictly verifies that the authenticated user profile matches the selected dashboard tab role, making it impossible to switch or bypass dashboards unauthorized.

**Privy Configured Networks:**
- Ethereum Mainnet
- Polygon
- Optimism

---

## 🏛️ Local-First / Offline-Safe Design

To guarantee 100% stability and zero dependency on remote servers during live demonstrations or offline reviews, LexChain is designed with a **highly robust local-first architecture**:

### 🔌 Intelligent Database Fallback
- The backend checks for the cloud **MongoDB Atlas URI** in the environment configurations.
- If Atlas is offline, inaccessible, or network-blocked, the backend **instantly and seamlessly boots an in-memory MongoDB server instance locally**.
- It then automatically seeds all the required demo cases and lawyer directories, meaning **the entire system remains fully operational even if you completely lose internet connection!**

### 📁 Real IPFS Storage
- Documents and files uploaded by police/admins are transferred directly to the decentralized IPFS network using high-speed custom **Pinata gateway endpoints** to secure permanent evidence hashes.

---

## 🗂 Quick Reference — Passcodes

| Role | Registration Passcode |
|------|-----------------------|
| Admin (Police) | `NYAYA2024` |
| Judge | `JUDGE2024` |
| User / Lawyer | *(no passcode required)* |

---

## 🤝 Contributing

Contributions are welcome! Follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m 'feat: add your feature'`
4. **Push** to the branch: `git push origin feature/your-feature-name`
5. **Open** a Pull Request

### Commit Message Conventions

| Prefix | Use For |
|--------|---------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `chore:` | Maintenance tasks |
| `docs:` | Documentation changes |
| `style:` | CSS/UI changes |
| `refactor:` | Code refactoring |

---

## 📄 License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ⚖️ for a Transparent Justice System**

*LexChain — Making legal evidence immutable, verifiable, and trustworthy.*

[![GitHub stars](https://img.shields.io/github/stars/yuvrajvibhute/Lexchain?style=social)](https://github.com/yuvrajvibhute/Lexchain)

</div>
