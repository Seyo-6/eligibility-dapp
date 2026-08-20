import { useState } from "react";
import { getSession, authedFetch } from "../services/wallet";

export default function AdminPanel() {
  const session = getSession();
  const [address, setAddress] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function call(path, options) {
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const res = await authedFetch(path, options);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(`Tx confirmed: ${data.txHash}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!session || session.role !== "admin") {
    return <p style={{ textAlign: "center", marginTop: 40 }}>Admin access required.</p>;
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto" }}>
      <h2>Admin panel</h2>

      <div style={{ border: "1px solid #eee", padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <h4 style={{ marginTop: 0 }}>Manage verifiers</h4>
        <input
          placeholder="Wallet address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 12 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={busy}
            onClick={() => call("/admin/verifiers", { method: "POST", body: JSON.stringify({ address }) })}
          >
            Add verifier
          </button>
          <button
            disabled={busy}
            onClick={() => call(`/admin/verifiers/${address}`, { method: "DELETE" })}
          >
            Remove verifier
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#666" }}>
          Note: this only grants the on-chain VERIFIER_ROLE. To let that
          wallet log into the Verifier Panel here, also add its address to
          the backend's VERIFIER_ADDRESSES env var.
        </p>
      </div>

      <div style={{ border: "1px solid #eee", padding: 16, borderRadius: 8 }}>
        <h4 style={{ marginTop: 0 }}>Registry status</h4>
        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={busy} onClick={() => call("/admin/pause", { method: "POST" })}>
            Pause claim submissions
          </button>
          <button disabled={busy} onClick={() => call("/admin/unpause", { method: "POST" })}>
            Unpause
          </button>
        </div>
      </div>

      {result && <p style={{ color: "green", marginTop: 16 }}>{result}</p>}
      {error && <p style={{ color: "crimson", marginTop: 16 }}>{error}</p>}
    </div>
  );
}
