import { useState } from "react";
import { getSession, authedFetch } from "../services/wallet";

// Note: reviewing claims by address lookup here for simplicity. A real
// verifier panel would list pending claims by querying indexed
// ClaimSubmitted events from your backend database, not by manual entry.
export default function VerifierPanel() {
  const session = getSession();
  const [address, setAddress] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function review(approve) {
    setError(null);
    setResult(null);
    try {
      const res = await authedFetch(`/claims/${address}/review`, {
        method: "POST",
        body: JSON.stringify({ approve })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Review failed");
      setResult(`Tx confirmed: ${data.txHash}`);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!session || (session.role !== "verifier" && session.role !== "admin")) {
    return <p style={{ textAlign: "center", marginTop: 40 }}>Verifier access required.</p>;
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto" }}>
      <h2>Verifier panel</h2>
      <input
        placeholder="Beneficiary wallet address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => review(true)}>Approve</button>
        <button onClick={() => review(false)}>Reject</button>
      </div>
      {result && <p style={{ color: "green" }}>{result}</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}
