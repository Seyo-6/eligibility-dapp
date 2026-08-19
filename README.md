# Eligibility & Disbursement dApp

A dApp for verifier-attested eligibility claims and stablecoin disbursement,
with MetaMask login and an optional KYC webhook integration point.

## Structure

```
contracts/   Solidity contracts (Hardhat) — EligibilityRegistry, DisbursementContract
backend/     Node.js/Express API — auth, claims, KYC webhook, event reads
frontend/    React (Vite) — MetaMask login, beneficiary dashboard, verifier panel
```

## Run order

### 1. Contracts
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test

# terminal A
npx hardhat node

# terminal B
npm run deploy:local
```
Copy the three printed contract addresses.

### 2. Backend
```bash
cd backend
cp .env.example .env
# paste in the addresses from step 1, and a local hardhat account private key
# as VERIFIER_PRIVATE_KEY (use one of the addresses `hardhat node` prints)
npm install
npm start
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Open http://localhost:5173, connect MetaMask (point it at the local Hardhat
network, chain ID 31337, RPC http://127.0.0.1:8545), and sign in.

## What's real vs. what's a placeholder

**Real / production-shaped:**
- Sign-in-with-wallet flow (nonce + signature verification, no passwords)
- On-chain contracts store only a category code, status, and document hash —
  never personal data
- Role separation (admin / verifier / beneficiary) via OpenZeppelin AccessControl
- KYC webhook route with signature verification, structured to plug in a
  real provider (DigiLocker, Onfido, Persona, etc.)

**Placeholders you'll need to replace before going live:**
- `MockStablecoin.sol` — swap for a real ERC-20/stablecoin address on any real network
- Nonce store is in-memory (`backend/src/services/auth.js`) — move to Redis/DB
- No database yet for indexing events or storing KYC session records — the
  schema is sketched in comments in `backend/src/routes/kyc.js`
- IPFS upload isn't wired up — `Dashboard.jsx` hashes a placeholder string
  instead of an actual uploaded file
- No contract audit — required before any mainnet deployment handling real funds
- No DPDP Act / data-protection compliance layer — required for a real
  deployment handling caste or income data in India

## Security notes

- The `contracts/` folder blocked its Solidity compiler download in this
  sandboxed environment (network allowlist) — compile and test it on your
  own machine or CI, where it will resolve normally.
- Never commit real private keys. `.env` files are gitignored — only
  `.env.example` files are checked in.
