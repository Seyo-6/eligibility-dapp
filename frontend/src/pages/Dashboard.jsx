import { useEffect, useState } from "react";
import { keccak256, toUtf8Bytes } from "ethers";
import { getSession, authedFetch, signOut } from "../services/wallet";
import { useNavigate } from "react-router-dom";

const STATUS_LABELS = ["No claim", "Pending review", "Approved", "Rejected"];

export default function Dashboard() {
  const session = getSession();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate("/");
      return;
    }
    loadClaim();
  }, []);

  async function loadClaim() {
    try {
      const res = await authedFetch("/claims/me");
      if (res.ok) setClaim(await res.json());
    } catch (err) {
      setError(err.message);
    }
  }

  // Demo submission: in a real flow, the file goes to IPFS first and
  // documentHash is the resulting CID (hashed). Here we just hash a
  // placeholder string to demonstrate the flow end-to-end.
  async function handleSubmitClaim() {
    setSubmitting(true);
    setError(null);
    try {
      const documentHash = keccak256(toUtf8Bytes(`placeholder-doc-${Date.now()}`));
      const res = await authedFetch("/claims/submit", {
        method: "POST",
        body: JSON.stringify({ documentHash, category: 1 })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Submission failed");
      await loadClaim();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  if (!session) return null;

  return (
    <div style={{ maxWidth: 560, margin: "40px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Dashboard</h2>
        <button onClick={handleSignOut}>Sign out</button>
      </div>
      <p>Wallet: {session.address}</p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {claim ? (
        <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8 }}>
          <p><strong>Status:</strong> {STATUS_LABELS[claim.status]}</p>
          {claim.status !== 0 && (
            <>
              <p><strong>Category:</strong> {claim.category}</p>
              <p><strong>Submitted:</strong> {new Date(claim.submittedAt * 1000).toLocaleString()}</p>
            </>
          )}
        </div>
      ) : (
        <p>Loading claim status...</p>
      )}

      {(!claim || claim.status === 0 || claim.status === 3) && (
        <button onClick={handleSubmitClaim} disabled={submitting} style={{ marginTop: 16 }}>
          {submitting ? "Submitting..." : "Submit eligibility claim"}
        </button>
      )}
    </div>
  );
}
