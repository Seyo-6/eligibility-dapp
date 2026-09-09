import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import Navbar from "../components/Navbar";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4001/api";

export default function PublicVerify() {
  const { appId: paramAppId } = useParams();
  const navigate = useNavigate();
  const [appIdInput, setAppIdInput] = useState(paramAppId || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tamper detection state
  const [fileHash, setFileHash] = useState(null);
  const [fileName, setFileName] = useState("");
  const [simulatedTamper, setSimulatedTamper] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState(null);

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
    setFileHash(null);
    setFileName("");
    setSimulatedTamper(false);
    setVerificationFeedback(null);

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

  // Real-time file hashing using Web Cryptography API & Keccak-256
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !result) return;

    setFileName(file.name);
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const hash = ethers.keccak256(bytes);
    setFileHash(hash);
    setSimulatedTamper(false);

    // Compare with registered hash
    checkHashMatch(hash, result.documentHash);
  }

  function checkHashMatch(computed, registered) {
    if (computed.toLowerCase() === registered.toLowerCase()) {
      setVerificationFeedback({
        status: "success",
        title: "✓ 100% AUTHENTIC & UNTAMPERED",
        message: "The cryptographic digest of your file exactly matches the immutable Keccak-256 hash committed to the Ethereum blockchain by the Tahsildar."
      });
    } else {
      setVerificationFeedback({
        status: "error",
        title: "⚠️ CRITICAL WARNING: TAMPERED DOCUMENT DETECTED!",
        message: "The calculated file hash does NOT match the official blockchain record. The document content, amount, or personal credentials have been modified after issuance."
      });
    }
  }

  function toggleTamperSimulation() {
    if (!result) return;
    const willTamper = !simulatedTamper;
    setSimulatedTamper(willTamper);

    if (willTamper) {
      // Simulate modified byte in document
      const fakeTamperedHash = ethers.keccak256(ethers.toUtf8Bytes((result.documentHash || "") + "_tampered_alteration"));
      setFileHash(fakeTamperedHash);
      setFileName("tampered_certificate_copy.pdf");
      checkHashMatch(fakeTamperedHash, result.documentHash);
    } else {
      setFileHash(result.documentHash);
      setFileName("official_authentic_bundle.json");
      checkHashMatch(result.documentHash, result.documentHash);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: 840, margin: "36px auto", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Telangana Public Verification Gateway
          </span>
          <h1 style={{ margin: "6px 0 0 0", fontSize: 26, fontWeight: 800, color: "#111827" }}>
            MeeSeva Certificate & Blockchain Verification
          </h1>
          <p style={{ margin: "8px 0 0 0", color: "#6b7280", fontSize: 14 }}>
            Verify the cryptographic authenticity of any Telangana government certificate on the Ethereum blockchain.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ background: "#ffffff", borderRadius: 10, padding: 20, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: 24 }}>
          <form onSubmit={(e) => { e.preventDefault(); verifyApplication(); }} style={{ display: "flex", gap: 10 }}>
            <input
              value={appIdInput}
              onChange={(e) => setAppIdInput(e.target.value)}
              placeholder="Enter Application ID (e.g. TS-CGC-2026-199981)"
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
            <strong>Verification Result: ✕ Invalid / Record Not Found</strong><br />
            {error}
          </div>
        )}

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Primary Certificate Status Card */}
            <div style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 24,
              border: result.valid ? "2px solid #10b981" : "2px solid #f59e0b",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, borderBottom: "1px solid #e5e7eb", paddingBottom: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: result.valid ? "#d1fae5" : "#fef3c7",
                  color: result.valid ? "#047857" : "#d97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: "bold"
                }}>
                  {result.valid ? "✓" : "!"}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: result.valid ? "#065f46" : "#92400e" }}>
                    {result.valid ? "GENUINE & OFFICIALLY ISSUED" : "IN PROCESS / NOT FINALIZED"}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    Status: {result.stageName} • Validity: {result.validUntil ? `Expiring on ${new Date(result.validUntil * 1000).toLocaleDateString("en-IN")}` : "Lifetime Permanent"}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13.5, background: "#f9fafb", padding: 16, borderRadius: 8, marginBottom: 18 }}>
                <div><strong>Application No:</strong> <span style={{ fontFamily: "monospace", color: "#1e3a8a" }}>{result.applicationId}</span></div>
                <div><strong>Certificate Type:</strong> {result.categoryName}</div>
                <div><strong>Applicant Name:</strong> {result.applicantName}</div>
                <div><strong>Father / Guardian:</strong> {result.fatherName}</div>
                <div><strong>District:</strong> {result.district}</div>
                <div><strong>Mandal:</strong> {result.mandal}</div>
                {result.casteGroup && <div><strong>Caste Group:</strong> {result.casteGroup} ({result.subCaste})</div>}
                {result.annualIncome && <div><strong>Annual Income:</strong> ₹ {Number(result.annualIncome).toLocaleString()}</div>}
                <div style={{ gridColumn: "1 / -1", wordBreak: "break-all" }}>
                  <strong>On-Chain Document Root Hash:</strong><br />
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: "#047857", fontWeight: 600 }}>{result.documentHash}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#6b7280" }}>
                <span>Issued by: {result.tahsildar ? `${result.tahsildar.slice(0, 10)}... (Tahsildar / MRO)` : "Competent Authority"}</span>
                <button
                  onClick={() => navigate(`/certificate/${result.applicationId}`)}
                  style={{ background: "#047857", color: "white", border: "none", padding: "8px 16px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                >
                  View Official Certificate →
                </button>
              </div>
            </div>

            {/* Interactive Tamper-Detection Visualizer (Lab Showcase Feature) */}
            <div style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 24,
              border: "1px solid #cbd5e1",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>🛡️</span> Interactive Tamper-Detection Hash Checker
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: 12.5, color: "#64748b" }}>
                    Drop a document or click the simulation button to prove how the blockchain instantly exposes forged or modified certificates.
                  </p>
                </div>

                {/* Simulation Button */}
                <button
                  onClick={toggleTamperSimulation}
                  style={{
                    background: simulatedTamper ? "#fee2e2" : "#f1f5f9",
                    color: simulatedTamper ? "#b91c1c" : "#334155",
                    border: simulatedTamper ? "1px solid #f87171" : "1px solid #cbd5e1",
                    padding: "6px 14px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {simulatedTamper ? "✕ Reset to Authentic" : "⚡ Simulate Tampered Document"}
                </button>
              </div>

              {/* Upload Drop Box */}
              <div style={{
                border: "2px dashed #cbd5e1",
                borderRadius: 8,
                padding: "16px 20px",
                textAlign: "center",
                background: "#f8fafc",
                marginBottom: 16
              }}>
                <input
                  type="file"
                  id="tamper-file-input"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <label htmlFor="tamper-file-input" style={{ cursor: "pointer", display: "block" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>📄</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#047857" }}>
                    Click to select file or drag-and-drop to compute Keccak-256 hash
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    Any PDF, image, or JSON document bundle
                  </div>
                </label>
              </div>

              {/* Hash Comparison Matrix */}
              {fileHash && (
                <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12.5, marginBottom: 14 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Selected File: </strong> <span style={{ fontFamily: "monospace" }}>{fileName}</span>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ color: "#64748b", fontWeight: 600 }}>1. Local File Keccak-256 Hash:</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: simulatedTamper ? "#b91c1c" : "#047857", fontWeight: 700, wordBreak: "break-all" }}>
                      {fileHash}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#64748b", fontWeight: 600 }}>2. Registered Blockchain Hash:</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "#0f172a", fontWeight: 700, wordBreak: "break-all" }}>
                      {result.documentHash}
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback Alert */}
              {verificationFeedback && (
                <div style={{
                  padding: 14,
                  borderRadius: 8,
                  border: verificationFeedback.status === "success" ? "1px solid #10b981" : "1px solid #ef4444",
                  background: verificationFeedback.status === "success" ? "#ecfdf5" : "#fef2f2",
                  color: verificationFeedback.status === "success" ? "#065f46" : "#991b1b",
                  fontSize: 13
                }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
                    {verificationFeedback.title}
                  </div>
                  <div>{verificationFeedback.message}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
