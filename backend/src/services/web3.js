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

const ROLES = {
  DEFAULT_ADMIN_ROLE: ethers.ZeroHash,
  VRO_ROLE: ethers.keccak256(ethers.toUtf8Bytes("VRO_ROLE")),
  RI_ROLE: ethers.keccak256(ethers.toUtf8Bytes("RI_ROLE")),
  TAHSILDAR_ROLE: ethers.keccak256(ethers.toUtf8Bytes("TAHSILDAR_ROLE"))
};

// Default Hardhat private keys for lab local demo
const DEFAULT_KEYS = {
  admin: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  vro: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  ri: "0x5de4111afa1a4b94908f83103eb2f9541082a37856ad7000e2ee2702380f0830",
  tahsildar: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
};

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");

function getSigner(role = "admin") {
  const normalized = (role || "admin").toLowerCase();
  const envKey = process.env[`${normalized.toUpperCase()}_PRIVATE_KEY`]
    || process.env.OFFICER_PRIVATE_KEY
    || process.env.VERIFIER_PRIVATE_KEY
    || DEFAULT_KEYS[normalized]
    || DEFAULT_KEYS.admin;

  return new ethers.Wallet(envKey, provider);
}

function getEligibilityContract(signerOrRole = false) {
  const address = process.env.ELIGIBILITY_REGISTRY_ADDRESS;
  if (!address) throw new Error("ELIGIBILITY_REGISTRY_ADDRESS not set in .env");

  let runner = provider;
  if (signerOrRole === true) {
    runner = getSigner("admin");
  } else if (typeof signerOrRole === "string") {
    runner = getSigner(signerOrRole);
  } else if (signerOrRole && typeof signerOrRole === "object") {
    runner = signerOrRole;
  }

  return new ethers.Contract(address, ELIGIBILITY_ABI, runner);
}

module.exports = {
  provider,
  getSigner,
  ROLES,
  getEligibilityContract
};
