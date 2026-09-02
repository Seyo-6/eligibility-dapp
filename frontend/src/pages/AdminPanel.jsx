import { useState } from "react";
import { getSession, authedFetch } from "../services/wallet";
import Navbar from "../components/Navbar";

export default function AdminPanel() {
  const session = getSession();
  const [address, setAddress] = useState("");
  const [selectedRole, setSelectedRole] = useState("VRO");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleAssignRole(isGrant) {
    if (!address) return setError("Enter wallet address");
    setError(null);
    setResult(null);
    setBusy(true);

    try {
      const res = await authedFetch(
        isGrant ? "/admin/officers" : `/admin/officers/${selectedRole}/${address}`,
        {
          method: isGrant ? "POST" : "DELETE",
          body: isGrant ? JSON.stringify({ address, role: selectedRole }) : undefined
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setResult(`✓ Success! Tx confirmed: ${data.txHash || "Updated"}`);
      setAddress("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePauseToggle(pause) {
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const res = await authedFetch(pause ? "/admin/pause" : "/admin/unpause", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pause action failed");
      setResult(`✓ Registry ${pause ? "Paused" : "Unpaused"}. Tx: ${data.txHash}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: 700, margin: "36px auto", padding: "0 20px" }}>
        <div style={{ background: "#ffffff", borderRadius: 12, padding: 24, border: "1px solid #e5e7eb", marginBottom: 24 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.5 }}>
            State Administration Console
          </span>
          <h1 style={{ margin: "4px 0 0 0", fontSize: 24, fontWeight: 800, color: "#111827" }}>
            Revenue Officer Role & Registry Management
          </h1>
          <p style={{ margin: "6px 0 0 0", color: "#6b7280", fontSize: 14 }}>
            Grant or revoke on-chain cryptographic authority for Village Revenue Officers, Revenue Inspectors, and Tahsildars.
          </p>
        </div>

        {/* Manage Officer Roles */}
        <div style={{ background: "#ffffff", borderRadius: 10, padding: 24, border: "1px solid #e5e7eb", marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 14px 0", fontSize: 16, fontWeight: 700, color: "#111827" }}>
            Assign Officer Jurisdiction & Role
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10, marginBottom: 12 }}>
            <input
              placeholder="Officer Ethereum Address (0x...)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, fontFamily: "monospace" }}
            />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, background: "#fff", fontWeight: 600 }}
            >
              <option value="VRO">VRO Role</option>
              <option value="RI">RI Role</option>
              <option value="TAHSILDAR">Tahsildar Role</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              disabled={busy}
              onClick={() => handleAssignRole(true)}
              style={{
                background: "#047857",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                padding: "9px 18px",
                fontWeight: 700,
                fontSize: 13,
                cursor: busy ? "not-allowed" : "pointer"
              }}
            >
              + Grant On-Chain Authority
            </button>
            <button
              disabled={busy}
              onClick={() => handleAssignRole(false)}
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                border: "1px solid #f87171",
                borderRadius: 6,
                padding: "9px 18px",
                fontWeight: 600,
                fontSize: 13,
                cursor: busy ? "not-allowed" : "pointer"
              }}
            >
              - Revoke Authority
            </button>
          </div>
        </div>

        {/* Registry Global Controls */}
        <div style={{ background: "#ffffff", borderRadius: 10, padding: 24, border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 700, color: "#111827" }}>
            Emergency Circuit Breaker
          </h3>
          <p style={{ margin: "0 0 14px 0", fontSize: 13, color: "#6b7280" }}>
            Pause or unpause on-chain certificate submissions across all MeeSeva kiosks and portals.
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              disabled={busy}
              onClick={() => handlePauseToggle(true)}
              style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #f59e0b", padding: "8px 16px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              ⏸ Pause Submissions
            </button>
            <button
              disabled={busy}
              onClick={() => handlePauseToggle(false)}
              style={{ background: "#d1fae5", color: "#065f46", border: "1px solid #10b981", padding: "8px 16px", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              ▶ Unpause Registry
            </button>
          </div>
        </div>

        {result && <div style={{ marginTop: 16, padding: 12, background: "#ecfdf5", border: "1px solid #10b981", borderRadius: 6, color: "#065f46", fontSize: 13 }}>{result}</div>}
        {error && <div style={{ marginTop: 16, padding: 12, background: "#fee2e2", border: "1px solid #f87171", borderRadius: 6, color: "#b91c1c", fontSize: 13 }}>{error}</div>}
      </main>
    </div>
  );
}

