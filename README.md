# Eligibility dApp — Telangana-inspired certificate prototype

A prototype dApp for verifier-attested eligibility claims, with MetaMask login and caste/income certificate application flows inspired by public Telangana certificate workflows.

**This is not an official Government of Telangana or MeeSeva service. Do not upload real Aadhaar numbers or sensitive documents.**

## Structure

```text
contracts/   Solidity / Hardhat — EligibilityRegistry
backend/     Node.js/Express API — wallet auth, claims, verifier review
frontend/    React/Vite — MetaMask login and certificate applications
render.yaml  Render deployment blueprint
```

## Local development

### Contracts
```bash
cd contracts
npm install
npm run compile
npm test
npx hardhat node
npm run deploy:local
```

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm start
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Sepolia deployment

The repository includes `contracts/scripts/deploy-sepolia.js` and a manual GitHub Actions workflow at `.github/workflows/deploy-sepolia.yml`.

Add these GitHub repository secrets before running the workflow:

- `SEPOLIA_RPC_URL` — an RPC endpoint from your provider
- `DEPLOYER_PRIVATE_KEY` — a dedicated Sepolia deployment wallet; never commit this
- `SEPOLIA_VERIFIER_ADDRESS` — wallet that should receive the verifier role

Run **Actions → Deploy EligibilityRegistry to Sepolia → Run workflow**. Copy the deployed registry address from the workflow logs.

Then configure the hosted frontend with:

```text
VITE_ELIGIBILITY_REGISTRY_ADDRESS=<deployed registry address>
VITE_API_BASE=<backend URL>/api
```

The hosted wallet flow should use Sepolia test ETH only.

## Render deployment

A `render.yaml` blueprint is included for:

- `eligibility-dapp-api` — Node/Express backend
- `eligibility-dapp-web` — Vite static frontend

Create a Render Blueprint from this repository. Configure the backend secrets:

```text
RPC_URL=<Sepolia RPC>
VERIFIER_PRIVATE_KEY=<dedicated verifier wallet private key>
VERIFIER_ADDRESSES=<verifier wallet address>
ELIGIBILITY_REGISTRY_ADDRESS=<deployed registry address>
FRONTEND_URL=<frontend URL>
JWT_SECRET=<long random secret>
```

Configure the frontend variables:

```text
VITE_API_BASE=https://<backend-service>.onrender.com/api
VITE_ELIGIBILITY_REGISTRY_ADDRESS=<deployed registry address>
```

After deployment, users can open the frontend URL, connect MetaMask, sign in, choose **Caste Certificate** or **Income Certificate**, upload a demo supporting file, and submit the document hash through MetaMask.

## Data model

Personal certificate information is intentionally not written to the blockchain. The prototype submits only a document hash and certificate category to the registry. Uploaded files are hashed in the browser; no file storage service is included yet.

## Admin panel

An `/admin` page and matching `/api/admin/*` backend routes let an admin
wallet manage verifiers and pause/unpause claim submissions on the
registry, without needing to run `hardhat console` manually:

- Add / remove an address's on-chain `VERIFIER_ROLE`
- Pause / unpause `submitClaim` on the registry (e.g. during an incident)

To use it, add your wallet address to `ADMIN_ADDRESSES` in the backend's
env, sign in with that wallet, and open `/admin`. Note this only grants the
on-chain role — to also let that wallet use the Verifier Panel UI, add it to
`VERIFIER_ADDRESSES` too.

## Prototype limitations

- One on-chain claim is currently associated with each wallet in the existing registry contract.
- Application form fields are UI/demo data and are not persisted to a database yet.
- No IPFS storage or event indexer is included.
- Nonces are stored in memory; use Redis/database for production.
- Verifier access is configured by `VERIFIER_ADDRESSES` for the demo.
- No smart-contract audit or DPDP compliance layer; do not use this for real government certificate processing or sensitive citizen data.
