# Contracts

## Setup (run on your own machine)

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Run a local chain + deploy

```bash
# terminal 1
npx hardhat node

# terminal 2
npm run deploy:local
```

This deploys, in order:
1. `MockStablecoin` (local testing only — replace with a real token address on any real network)
2. `EligibilityRegistry`
3. `DisbursementContract`

...funds the disbursement contract, and grants the deployer the verifier role.
Copy the three printed addresses into `backend/.env`.

## Contracts

- `EligibilityRegistry.sol` — verifier-attested eligibility claims. Stores only a
  category code, a status, and a document hash (IPFS CID) — never personal data.
- `DisbursementContract.sol` — pays an ERC-20 token to addresses the registry
  marks eligible, with a minimum interval between payouts.
- `MockStablecoin.sol` — local-testing-only ERC-20. Do not deploy to a real network.
