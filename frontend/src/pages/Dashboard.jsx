import { useEffect, useState } from "react";
import { getSession, authedFetch, signOut } from "../services/wallet";
import { useNavigate } from "react-router-dom";

const STATUS_LABELS = ["No claim", "Pending review", "Approved", "Rejected"];

export default function Dashboard() {
  const session = getSession();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [error, setError] = useState(null);

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

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  if (!session) return null;

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Eligibility dApp</h1>
        <button onClick={handleSignOut}>Sign out</button>
      </div>
      <p>Connected wallet: {session.address}</p>
      <p>Prototype inspired by public Telangana certificate workflows.</p>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 24 }}>
        <section style={{ border: "1px solid #ccc", borderRadius: 8, padding: 20 }}>
          <h2>Caste Certificate</h2>
          <p>Caste, nativity and date-of-birth style application.</p>
          <button onClick={() => navigate("/certificate?type=caste")}>Start application</button>
        </section>
        <section style={{ border: "1px solid #ccc", borderRadius: 8, padding: 20 }}>
          <h2>Income Certificate</h2>
          <p>Annual income and purpose style application.</p>
          <button onClick={() => navigate("/certificate?type=income")}>Start application</button>
        </section>
      </div>

      <section style={{ marginTop: 24, border: "1px solid #ccc", borderRadius: 8, padding: 20 }}>
        <h2>My application</h2>
        {!claim || claim.status === 0 ? (
          <p>No claim submitted yet.</p>
        ) : (
          <>
            <p><strong>Status:</strong> {STATUS_LABELS[claim.status]}</p>
            <p><strong>Certificate category:</strong> {claim.category === 1 ? "Caste" : "Income"}</p>
            <p><strong>Submitted:</strong> {new Date(claim.submittedAt * 1000).toLocaleString()}</p>
            {claim.verifiedBy && <p><strong>Verified by:</strong> {claim.verifiedBy}</p>}
          </>
        )}
      </section>

      <p style={{ marginTop: 24, fontSize: 13 }}>
        Demo only — do not upload real Aadhaar numbers or sensitive documents. This is not an official Government of Telangana or MeeSeva service.
      </p>
    </div>
  );
}
