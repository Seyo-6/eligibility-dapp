import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, authedFetch, claimDbtOnChain } from "../services/wallet";
import Navbar from "../components/Navbar";

export default function DbtPortal() {
  const session = getSession();
  const navigate = useNavigate();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimStatus, setClaimStatus] = useState({});
  const [error, setError] = useState(null);
  const [myApplications, setMyApplications] = useState([]);

  useEffect(() => {
    if (!session) {
      navigate("/");
      return;
    }
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Schemes
      const schemesRes = await authedFetch("/applications/public/schemes");
      if (schemesRes.ok) setSchemes(await schemesRes.json());

      // 2. Fetch My Certificates
      const appsRes = await authedFetch("/applications/my");
      if (appsRes.ok) setMyApplications(await appsRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim(schemeId) {
    setClaimLoading(true);
    setError(null);
    try {
      setClaimStatus((prev) => ({ ...prev, [schemeId]: "Verifying on-chain MeeSeva credentials & transferring tokens..." }));
      const txHash = await claimDbtOnChain(schemeId);
      setClaimStatus((prev) => ({
        ...prev,
        [schemeId]: `✓ Entitlement Disbursed! Transaction Hash: ${txHash.slice(0, 16)}...`
      }));
    } catch (err) {
      setError(err.message || "Claim failed. Check certificate validity and interval cooldown.");
      setClaimStatus((prev) => ({ ...prev, [schemeId]: "" }));
    } finally {
      setClaimLoading(false);
    }
  }

  const hasApprovedCaste = myApplications.some((a) => a.category === 1 && a.stage === 4);
  const hasApprovedIncome = myApplications.some((a) => a.category === 2 && a.stage === 4);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: 1000, margin: "32px auto", padding: "0 20px" }}>
        <div style={{ background: "#ffffff", borderRadius: 12, padding: 24, border: "1px solid #e5e7eb", marginBottom: 28 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Telangana Direct Benefit Transfer (DBT) Ecosystem
          </span>
          <h1 style={{ margin: "4px 0 0 0", fontSize: 24, fontWeight: 800, color: "#111827" }}>
            State Welfare Schemes & Scholarship Payouts
          </h1>
          <p style={{ margin: "6px 0 0 0", color: "#6b7280", fontSize: 14 }}>
            Direct tokenized disbursements powered by on-chain MeeSeva certificate verification. No intermediaries or paperwork delays.
          </p>
        </div>

        {/* Citizen Certificate Eligibility Summary */}
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 18, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 15, fontWeight: 700, color: "#1e3a8a" }}>
            Your Verified Credential Status:
          </h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
            <div>
              Caste Certificate: {hasApprovedCaste ? <strong style={{ color: "#047857" }}>✓ Verified & Active</strong> : <span style={{ color: "#b91c1c" }}>✕ Not Issued</span>}
            </div>
            <div>
              Income Certificate: {hasApprovedIncome ? <strong style={{ color: "#047857" }}>✓ Verified & Active</strong> : <span style={{ color: "#b91c1c" }}>✕ Not Issued</span>}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: 14, background: "#fee2e2", border: "1px solid #f87171", borderRadius: 8, color: "#b91c1c", fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Active Schemes List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {schemes.map((scheme) => {
            const isEligible = scheme.requiredCategory === 1 ? hasApprovedCaste : hasApprovedIncome;

            return (
              <div
                key={scheme.id}
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 24,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#e0e7ff", color: "#3730a3", padding: "2px 8px", borderRadius: 4 }}>
                      SCHEME #{scheme.id}
                    </span>
                    <h2 style={{ margin: "6px 0 4px 0", fontSize: 18, fontWeight: 800, color: "#111827" }}>
                      {scheme.name}
                    </h2>
                    <p style={{ margin: "0 0 12px 0", fontSize: 14, color: "#4b5563", maxWidth: 650 }}>
                      {scheme.description}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#047857" }}>{scheme.amount}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>Per {scheme.intervalDays} Days</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f3f4f6", paddingTop: 16, marginTop: 8, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ fontSize: 13, color: "#4b5563" }}>
                    Prerequisite: <strong>{scheme.categoryName}</strong>
                  </div>

                  <div>
                    {isEligible ? (
                      <button
                        onClick={() => handleClaim(scheme.id)}
                        disabled={claimLoading}
                        style={{
                          background: "#047857",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 6,
                          padding: "10px 20px",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: claimLoading ? "not-allowed" : "pointer",
                          boxShadow: "0 2px 4px rgba(4,120,87,0.2)"
                        }}
                      >
                        {claimLoading ? "Processing..." : "⚡ Claim Entitlement (Direct Transfer)"}
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/certificate?type=${scheme.requiredCategory === 1 ? "caste" : "income"}`)}
                        style={{
                          background: "#f3f4f6",
                          color: "#374151",
                          border: "1px solid #d1d5db",
                          borderRadius: 6,
                          padding: "9px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Apply for Required Certificate →
                      </button>
                    )}
                  </div>
                </div>

                {claimStatus[scheme.id] && (
                  <div style={{ marginTop: 14, padding: 10, background: "#ecfdf5", border: "1px solid #10b981", borderRadius: 6, color: "#065f46", fontSize: 13 }}>
                    {claimStatus[scheme.id]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
