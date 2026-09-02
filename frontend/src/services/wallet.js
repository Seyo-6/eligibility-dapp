import { BrowserProvider, Contract, ethers } from "ethers";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
const REGISTRY_ADDRESS = import.meta.env.VITE_ELIGIBILITY_REGISTRY_ADDRESS;
const DISBURSEMENT_ADDRESS = import.meta.env.VITE_DISBURSEMENT_CONTRACT_ADDRESS;

export const ELIGIBILITY_ABI = [
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
  "function unpause() external"
];

export const DISBURSEMENT_ABI = [
  "function claimDisbursement(uint256 schemeId) external",
  "function disburse(address beneficiary, uint256 schemeId) external",
  "function schemes(uint256) view returns (string name, uint8 requiredCategory, uint256 payoutAmount, uint256 interval, bool active)",
  "function schemeCount() view returns (uint256)",
  "function canClaim(address beneficiary, uint256 schemeId) view returns (bool eligible, string memory reason)",
  "function totalDisbursed(address, uint256) view returns (uint256)",
  "function lastDisbursement(address, uint256) view returns (uint256)",
  "function contractBalance() view returns (uint256)"
];

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask not found. Please install it or use Demo Mode to continue.");
  }
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}

export async function signInWithWallet() {
  const { signer, address } = await connectWallet();
  const nonceRes = await fetch(`${API_BASE}/auth/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address })
  });
  if (!nonceRes.ok) throw new Error("Failed to get sign-in message from backend");
  const { message } = await nonceRes.json();
  const signature = await signer.signMessage(message);

  const verifyRes = await fetch(`${API_BASE}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, signature })
  });
  if (!verifyRes.ok) throw new Error("Signature verification failed");
  const { token, role } = await verifyRes.json();

  localStorage.setItem("session_token", token);
  localStorage.setItem("wallet_address", address);
  localStorage.setItem("role", role);
  return { address, role, token };
}

export async function signInDemo(role = "citizen") {
  const res = await fetch(`${API_BASE}/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role })
  });
  if (!res.ok) throw new Error("Demo login failed");
  const { token, address, role: userRole } = await res.json();

  localStorage.setItem("session_token", token);
  localStorage.setItem("wallet_address", address);
  localStorage.setItem("role", userRole);
  return { address, role: userRole, token };
}

export function getSession() {
  const token = localStorage.getItem("session_token");
  const address = localStorage.getItem("wallet_address");
  const role = localStorage.getItem("role");
  if (!token) return null;
  return { token, address, role };
}

export function signOut() {
  localStorage.removeItem("session_token");
  localStorage.removeItem("wallet_address");
  localStorage.removeItem("role");
}

export function authedFetch(path, options = {}) {
  const session = getSession();
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers || {})
    }
  });
}

// Smart Contract Interactions
export async function submitApplicationOnChain(applicationId, category, documentHash, validUntil = 0) {
  if (window.ethereum && REGISTRY_ADDRESS) {
    try {
      const { signer } = await connectWallet();
      const registry = new Contract(REGISTRY_ADDRESS, ELIGIBILITY_ABI, signer);
      const tx = await registry.submitApplication(applicationId, category, documentHash, validUntil);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (e) {
      console.warn("Wallet on-chain submission notice:", e.message);
    }
  }
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

export async function verifyByVROOnChain(applicationId, approve, remarks) {
  if (window.ethereum && REGISTRY_ADDRESS) {
    try {
      const { signer } = await connectWallet();
      const registry = new Contract(REGISTRY_ADDRESS, ELIGIBILITY_ABI, signer);
      const tx = await registry.verifyByVRO(applicationId, approve, remarks);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (e) {
      console.warn("VRO on-chain action notice:", e.message);
    }
  }
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

export async function endorseByRIOnChain(applicationId, approve, remarks) {
  if (window.ethereum && REGISTRY_ADDRESS) {
    try {
      const { signer } = await connectWallet();
      const registry = new Contract(REGISTRY_ADDRESS, ELIGIBILITY_ABI, signer);
      const tx = await registry.endorseByRI(applicationId, approve, remarks);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (e) {
      console.warn("RI on-chain action notice:", e.message);
    }
  }
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

export async function issueByTahsildarOnChain(applicationId, approve, remarks) {
  if (window.ethereum && REGISTRY_ADDRESS) {
    try {
      const { signer } = await connectWallet();
      const registry = new Contract(REGISTRY_ADDRESS, ELIGIBILITY_ABI, signer);
      const tx = await registry.issueByTahsildar(applicationId, approve, remarks);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (e) {
      console.warn("Tahsildar on-chain action notice:", e.message);
    }
  }
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

export async function claimDbtOnChain(schemeId) {
  if (window.ethereum && DISBURSEMENT_ADDRESS) {
    try {
      const { signer } = await connectWallet();
      const disbursement = new Contract(DISBURSEMENT_ADDRESS, DISBURSEMENT_ABI, signer);
      const tx = await disbursement.claimDisbursement(schemeId);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (e) {
      console.warn("DBT on-chain claim notice:", e.message);
      throw e;
    }
  }
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

