import { BrowserProvider } from "ethers";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask not found. Please install it to continue.");
  }
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}

// Full sign-in flow: get nonce -> sign message -> verify -> store session token
export async function signInWithWallet() {
  const { signer, address } = await connectWallet();

  const nonceRes = await fetch(`${API_BASE}/auth/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address })
  });
  if (!nonceRes.ok) throw new Error("Failed to get sign-in message");
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
