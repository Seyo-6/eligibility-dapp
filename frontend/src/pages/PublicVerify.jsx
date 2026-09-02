import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

export default function PublicVerify() {
  const { appId: paramAppId } = useParams();
  const navigate = useNavigate();
  const [appIdInput, setAppIdInput] = useState(paramAppId || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (paramAppId) {
      verifyApplication(paramAppId);
    }
  }, [paramAppId]);

  async function verifyApplication(idToVerify) {
    const target = idToVerify || appIdInput;
    if (!target) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/applications/public/verify/${target.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Application not found in MeeSeva registry");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Telangana Public Verification Gateway
          </span>
          <h1 style={{ margin: "6px 0 0 0", fontSize: 26, fontWeight: 800, color: "#111827" }}>
            Official MeeSeva Certificate Verification
          </h1>
          <p style={{ margin: "8px 0 0 0", color: "#6b7280", fontSize: 14 }}>
            Verify the cryptographic authenticity of any Telangana government certificate on the Ethereum blockchain.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ background: "#ffffff", borderRadius: 10, padding: 24, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: 28 }}>
          <form onSubmit={(e) => { e.preventDefault(); verifyApplication(); }} style={{ display: "flex", gap: 10 }}>
            <input
              value={appIdInput}
              onChange={(e) => setAppIdInput(e.target.value)}
              placeholder="Enter Application ID (e.g. TS-CGC-2026-0001)"
              style={{ flex: 1, padding: "12px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#047857",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Verifying..." : "Verify Credential"}
            </button>
          </form>
        </div>

        {error && (
          <div style={{ padding: 16, background: "#fee2e2", border: "1px solid #f87171", borderRadius: 8, color: "#b91c1c", fontSize: 14, marginBottom: 24, textAlign: "center" }}>
            <strong>Verification Result: ✕ Invalid / Not Found</strong><br />
            {error}
          </div>
        )}

        {result && (
          <div style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 28,
            border: result.valid ? "2px solid #10b981" : "2px solid #f59e0b",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, borderBottom: "1px solid #e5e7eb", paddingBottom: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: result.valid ? "#d1fae5" : "#fef3c7",
                color: result.valid ? "#047857" : "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: "bold"
              }}>
                {result.valid ? "✓" : "!"}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: result.valid ? "#065f46" : "#92400e" }}>
                  {result.valid ? "GENUINE & OFFICIALLY ISSUED" : "IN PROCESS / NOT FINALIZED"}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  Status: {result.stageName}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 14, background: "#f9fafb", padding: 16, borderRadius: 8, marginBottom: 20 }}>
              <div><strong>Application No:</strong> <span style={{ fontFamily: "monospace" }}>{result.applicationId}</span></div>
              <div><strong>Certificate Type:</strong> {result.categoryName}</div>
              <div><strong>Applicant Name:</strong> {result.applicantName}</div>
              <div><strong>Father / Guardian:</strong> {result.fatherName}</div>
              <div><strong>District:</strong> {result.district}</div>
              <div><strong>Mandal:</strong> {result.mandal}</div>
              {result.casteGroup && <div><strong>Caste Group:</strong> {result.casteGroup} ({result.subCaste})</div>}
              {result.annualIncome && <div><strong>Annual Income:</strong> ₹ {Number(result.annualIncome).toLocaleString()}</div>}
              <div style={{ gridColumn: "1 / -1", wordBreak: "break-all" }}>
                <strong>Cryptographic Document Hash:</strong> <span style={{ fontFamily: "monospace", fontSize: 12 }}>{result.documentHash}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#6b7280" }}>
              <span>Issued Authority: {result.tahsildar ? `${result.tahsildar.slice(0, 10)}...` : "Tahsildar / MRO"}</span>
              <button
                onClick={() => navigate(`/certificate/${result.applicationId}`)}
                style={{ background: "#047857", color: "white", border: "none", padding: "8px 14px", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}
              >
                View Full Certificate →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
