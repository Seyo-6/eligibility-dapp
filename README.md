# Telangana MeeSeva 2.0 Blockchain Certificate & DBT DApp

A decentralized, tamper-proof citizen certificate issuance and Direct Benefit Transfer (DBT) application modeled after the **Telangana MeeSeva & Revenue Department statutory workflow**.

Built for academic evaluation, lab demonstrations, and capstone project presentations.

---

## 🏛️ System Architecture & Workflow

```
                                  [ TELANGANA REVENUE HIERARCHY ]

 [ Citizen / Kiosk ]
        │
        ▼ (Submit Application + Documents)
 [ MeeSeva Gateway ] ──► Stores metadata bundle & generates Keccak-256 hash
        │
        ▼ (Stage 1)
 [ Village Revenue Officer (VRO) ] ──► Conducts local field inquiry & attaches survey notes
        │
        ▼ (Stage 2)
 [ Revenue Inspector (RI) ] ───────► Cross-verifies revenue/land records & endorses
        │
        ▼ (Stage 3)
 [ Tahsildar / MRO ] ──────────────► Competent authority applies Digital Signature (DSC)
        │
        ├────────────────────────────────┬───────────────────────────────┐
        ▼                                ▼                               ▼
 [ Issued Certificate ]       [ Public QR Verification ]       [ Direct Benefit Transfer ]
 (With Hologram & QR code)    (Live on-chain lookup)           (ePASS Scholarship / Grants)
```

---

## 🚀 Quick Start (Local Setup)

### 1. Smart Contracts
```bash
cd contracts
npm install
npm test              # Run automated Hardhat test suite (7/7 tests)
npx hardhat node      # Start local Ethereum blockchain node (keep running in terminal 1)
```

In a second terminal:
```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```
*Copy the printed contract addresses (`ELIGIBILITY_REGISTRY_ADDRESS` and `DISBURSEMENT_CONTRACT_ADDRESS`) into your `.env` files.*

### 2. Backend API
```bash
cd backend
cp .env.example .env  # Paste contract addresses into .env
npm install
npm start             # Starts on port 4000
```

### 3. Frontend App
```bash
cd frontend
cp .env.example .env  # Paste contract addresses into .env
npm install
npm run dev           # Starts Vite dev server at http://localhost:5173
```

---

## 🧪 1-Click Demo Profiles (For Lab Presentation)

The login page at `http://localhost:5173` features **1-Click Demo Profiles** so you can present the complete 3-tier workflow without constantly switching MetaMask accounts:

1. **Citizen (`citizen`)**: Apply for Caste/Community, Income, Residence, or EWS certificate; upload sample proofs; track application progress.
2. **VRO Officer (`vro`)**: Inspect pending dossiers in Stage 1 queue; enter field verification notes; verify and forward to RI.
3. **Revenue Inspector (`ri`)**: Inspect VRO findings in Stage 2 queue; cross-verify revenue registers; endorse to Tahsildar.
4. **Tahsildar / MRO (`tahsildar`)**: Review complete dossier in Stage 3 queue; apply cryptographic Digital Signature and issue on-chain.
5. **Print & Verify (`/certificate/:appId` & `/verify/:appId`)**: View official Telangana MeeSeva certificate with live QR code; scan or open public verification page.
6. **DBT Portal (`/dbt`)**: Switch to citizen profile and claim **ePASS Post-Matric Scholarship** (250 mUSD tokens) — smart contract verifies active on-chain certificate before releasing funds.
7. **State Admin (`admin`)**: Add/remove officer roles or trigger the emergency circuit breaker pause.

---

## 🛡️ Key Features

- **Multi-Certificate Support**: Citizen can hold multiple distinct certificates (Caste, Income, Residence, EWS).
- **Statutory 3-Tier Workflow**: True VRO $\rightarrow$ RI $\rightarrow$ Tahsildar chain of custody enforced on-chain.
- **Privacy First (DPDP Compliance)**: No raw citizen PII stored on-chain; only cryptographic Keccak-256 bundle hashes are written to the blockchain.
- **Dynamic Validity**: Income certificates expire after 1 financial year; Caste certificates have lifetime validity.
- **Direct Benefit Transfer (DBT)**: Real-time on-chain verification for welfare scheme and scholarship payouts.
- **Public QR Verification**: Instant verification of credentials without requiring logins.

