const { ethers } = require("ethers");
require("dotenv").config();

const ELIGIBILITY_ABI = [
  "function submitClaim(bytes32 documentHash, uint8 category) external",
  "function reviewClaim(address beneficiary, bool approve) external",
  "function isEligible(address beneficiary) external view returns (bool)",
  "function getClaim(address beneficiary) external view returns (tuple(bytes32 documentHash, uint8 category, uint8 status, address verifiedBy, uint256 submittedAt, uint256 decidedAt))",
  "event ClaimSubmitted(address indexed beneficiary, uint8 category, bytes32 documentHash)",
  "event ClaimReviewed(address indexed beneficiary, address indexed verifier, bool approved)"
];

const DISBURSEMENT_ABI = [
  "function disburse(address beneficiary) external",
  "function totalDisbursed(address) view returns (uint256)",
  "function lastDisbursement(address) view returns (uint256)",
  "event Disbursed(address indexed beneficiary, uint256 amount)"
];

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");

// Wallet the backend uses to sign transactions on behalf of the system
// (e.g. auto-approving a claim once a KYC webhook confirms identity).
// In production this should be a dedicated, access-controlled hot wallet,
// ideally behind a transaction-signing service rather than a raw private key.
const signer = process.env.VERIFIER_PRIVATE_KEY
  ? new ethers.Wallet(process.env.VERIFIER_PRIVATE_KEY, provider)
  : null;

function getEligibilityContract(withSigner = false) {
  const address = process.env.ELIGIBILITY_REGISTRY_ADDRESS;
  if (!address) throw new Error("ELIGIBILITY_REGISTRY_ADDRESS not set");
  return new ethers.Contract(address, ELIGIBILITY_ABI, withSigner ? signer : provider);
}

function getDisbursementContract(withSigner = false) {
  const address = process.env.DISBURSEMENT_CONTRACT_ADDRESS;
  if (!address) throw new Error("DISBURSEMENT_CONTRACT_ADDRESS not set");
  return new ethers.Contract(address, DISBURSEMENT_ABI, withSigner ? signer : provider);
}

module.exports = { provider, signer, getEligibilityContract, getDisbursementContract };
