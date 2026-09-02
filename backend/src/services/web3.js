const { ethers } = require("ethers");
require("dotenv").config();

const ELIGIBILITY_ABI = [
  "function submitApplication(string calldata applicationId, uint8 category, bytes32 documentHash, uint256 validUntil) external",
  "function verifyByVRO(string calldata applicationId, bool approve, string calldata remarks) external",
  "function endorseByRI(string calldata applicationId, bool approve, string calldata remarks) external",
  "function issueByTahsildar(string calldata applicationId, bool approve, string calldata remarks) external",
  "function revokeCertificate(string calldata applicationId, string calldata reason) external",
  "function getApplication(string calldata applicationId) external view returns (tuple(string applicationId, address beneficiary, uint8 category, bytes32 documentHash, uint8 stage, uint256 submittedAt, uint256 decidedAt, uint256 validUntil, address vro, address ri, address tahsildar, string remarks))",
  "function getBeneficiaryApplications(address beneficiary) external view returns (string[] memory)",
  "function getAllApplicationIds() external view returns (string[] memory)",
  "function totalApplications() external view returns (uint256)",
  "function isCertificateValid(string calldata applicationId) external view returns (bool)",
  "function isBeneficiaryEligible(address beneficiary, uint8 category) external view returns (bool)",
  "function addOfficer(bytes32 role, address officer) external",
  "function removeOfficer(bytes32 role, address officer) external",
  "function pause() external",
  "function unpause() external",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "event ApplicationSubmitted(string indexed applicationId, address indexed beneficiary, uint8 category, bytes32 documentHash)",
  "event VROVerified(string indexed applicationId, address indexed vro, bool approved, string remarks)",
  "event RIEndorsed(string indexed applicationId, address indexed ri, bool approved, string remarks)",
  "event CertificateIssued(string indexed applicationId, address indexed tahsildar, uint256 validUntil, string remarks)",
  "event ApplicationRejected(string indexed applicationId, address indexed officer, uint8 stageAtRejection, string remarks)",
  "event CertificateRevoked(string indexed applicationId, address indexed officer, string reason)"
];

const DISBURSEMENT_ABI = [
  "function claimDisbursement(uint256 schemeId) external",
  "function disburse(address beneficiary, uint256 schemeId) external",
  "function schemes(uint256) view returns (string name, uint8 requiredCategory, uint256 payoutAmount, uint256 interval, bool active)",
  "function schemeCount() view returns (uint256)",
  "function canClaim(address beneficiary, uint256 schemeId) view returns (bool eligible, string memory reason)",
  "function totalDisbursed(address, uint256) view returns (uint256)",
  "function lastDisbursement(address, uint256) view returns (uint256)",
  "function contractBalance() view returns (uint256)",
  "event Disbursed(address indexed beneficiary, uint256 indexed schemeId, uint256 amount)"
];

const ROLES = {
  DEFAULT_ADMIN_ROLE: ethers.ZeroHash,
  VRO_ROLE: ethers.keccak256(ethers.toUtf8Bytes("VRO_ROLE")),
  RI_ROLE: ethers.keccak256(ethers.toUtf8Bytes("RI_ROLE")),
  TAHSILDAR_ROLE: ethers.keccak256(ethers.toUtf8Bytes("TAHSILDAR_ROLE"))
};

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");

const signer = process.env.OFFICER_PRIVATE_KEY || process.env.VERIFIER_PRIVATE_KEY
  ? new ethers.Wallet(process.env.OFFICER_PRIVATE_KEY || process.env.VERIFIER_PRIVATE_KEY, provider)
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

module.exports = {
  provider,
  signer,
  ROLES,
  getEligibilityContract,
  getDisbursementContract
};
