import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, authedFetch } from "../services/wallet";
import Navbar from "../components/Navbar";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4001/api";

const STAGE_CONFIG = {
  1: { label: "1/3: VRO Field Verification", color: "#d97706", bg: "#fef3c7" },
  2: { label: "2/3: RI Scrutiny", color: "#c2410c", bg: "#ffedd5" },
  3: { label: "3/3: Tahsildar Digital Signature", color: "#7c3aed", bg: "#ede9fe" },
  4: { label: "✓ Issued & Digitally Signed", color: "#047857", bg: "#d1fae5" },
  5: { label: "✕ Rejected with Shortfall", color: "#b91c1c", bg: "#fee2e2" },
  6: { label: "⚠ Revoked", color: "#4b5563", bg: "#f3f4f6" }
};

export default function Dashboard() {
  const session = getSession();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimelineApp, setSelectedTimelineApp] = useState(null);
  const [fastTracking, setFastTracking] = useState(false);
  const [fastTrackStatus, setFastTrackStatus] = useState("");

  useEffect(() => {
    if (!session) {
      navigate("/");
      return;
    }
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      setLoading(true);
      const res = await authedFetch("/applications/my");
      if (res.ok) {
        setApplications(await res.json());
      } else {
        const err = await res.json();
        setError(err.error || "Failed to load applications");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 1-Click Fast-Track Demo Pipeline for quick lab evaluation
  async function handleFastTrackDemo(categoryNum = 1) {
    try {
      setFastTracking(true);
      setError(null);
      setFastTrackStatus("1/4: Lodging application at MeeSeva Kiosk...");

      // 1. Citizen lodges
      const applyRes = await authedFetch("/applications/apply", {
        method: "POST",
        body: JSON.stringify({
          category: categoryNum,
          applicantName: categoryNum === 1 ? "K. Sai Praneeth" : "Anitha Reddy",
          fatherName: categoryNum === 1 ? "K. Satyanarayana" : "A. Mohan Reddy",
          district: "Warangal",
          mandal: "Hanamkonda",
          village: "Madikonda",
          pincode: "506001",
          casteGroup: categoryNum === 1 ? "BC-B" : undefined,
          subCaste: categoryNum === 1 ? "Padmashali" : undefined,
          annualIncome: categoryNum === 2 ? "75000" : undefined,
          purpose: categoryNum === 2 ? "College Fee Reimbursement / ePASS" : undefined
        })
      });

      if (!applyRes.ok) throw new Error("Failed to lodge demo application");
      const appData = await applyRes.json();
      const appId = appData.applicationId;

      // 2. VRO verifies
      setFastTrackStatus("2/4: VRO completing field verification...");
      const vroRes = await fetch(`${API_BASE}/auth/demo-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "vro" })
      });
      const { token: vroToken } = await vroRes.json();

      await fetch(`${API_BASE}/applications/${appId}/review`, {
        method: "POST",
        headers: { Authorization: `Bearer ${vroToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", remarks: "Field inquiry completed; applicant is genuine resident" })
      });

      // 3. RI endorses
      setFastTrackStatus("3/4: RI cross-verifying revenue registers...");
      const riRes = await fetch(`${API_BASE}/auth/demo-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "ri" })
      });
      const { token: riToken } = await riRes.json();

      await fetch(`${API_BASE}/applications/${appId}/review`, {
        method: "POST",
        headers: { Authorization: `Bearer ${riToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", remarks: "Revenue books and genealogy confirmed" })
      });

      // 4. Tahsildar issues
      setFastTrackStatus("4/4: Tahsildar applying Digital Signature (DSC) & On-Chain Issuance...");
      const tahRes = await fetch(`${API_BASE}/auth/demo-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "tahsildar" })
      });
      const { token: tahToken } = await tahRes.json();

      await fetch(`${API_BASE}/applications/${appId}/review`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tahToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", remarks: "Approved and digitally signed by Tahsildar / MRO" })
      });

      setFastTrackStatus(`✓ Application ${appId} successfully fast-tracked to Issued!`);
      await loadApplications();
    } catch (err) {
      setError(err.message);
      setFastTrackStatus("");
    } finally {
      setFastTracking(false);
    }
  }

  if (!session) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: "32px auto", padding: "0 20px" }}>
        {/* Welcome & Quick Apply Header */}
        <div style={{
          background: "#ffffff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid #e5e7eb",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#047857", letterSpacing: 0.5, textTransform: "uppercase" }}>
              Government of Telangana • MeeSeva 2.0
            </span>
            <h1 style={{ margin: "2px 0 0 0", fontSize: 24, fontWeight: 800, color: "#111827" }}>
              Citizen Services Dashboard
            </h1>
            <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: 14 }}>
              Track statutory 3-tier certificate progress and access blockchain-verified credentials.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {/* 1-Click Fast Track Button */}
            <button
              onClick={() => handleFastTrackDemo(1)}
              disabled={fastTracking}
              style={{
                background: "#f0fdf4",
                color: "#166534",
                border: "1px solid #86efac",
                borderRadius: 8,
                padding: "9px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: fastTracking ? "not-allowed" : "pointer"
              }}
            >
              {fastTracking ? "Processing Pipeline..." : "⚡ Fast-Track Demo Application"}
            </button>

            <button
              onClick={() => navigate("/certificate")}
              style={{
                background: "#047857",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(4,120,87,0.2)"
              }}
            >
              + Apply for New Certificate
            </button>
          </div>
        </div>

        {fastTrackStatus && (
          <div style={{
            background: "#ecfdf5",
            border: "1px solid #10b981",
            borderRadius: 8,
            padding: "10px 16px",
            color: "#065f46",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20
          }}>
            {fastTrackStatus}
          </div>
        )}

        {/* Available Certificate Services: Caste and Income */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#374151", marginBottom: 14 }}>
          MeeSeva Certificate Services
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          <div style={{ background: "#ffffff", borderRadius: 10, padding: 22, border: "1px solid #e5e7eb", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>📜</div>
            <h3 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 700, color: "#111827" }}>Caste & Community Certificate</h3>
            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
              Statutory community, nativity, and date-of-birth certification for SC, ST, BC, and OC groups with permanent lifetime validity on-chain.
            </p>
            <button
              onClick={() => navigate("/certificate?type=caste")}
              style={{ background: "#047857", color: "#ffffff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}
            >
              Apply for Caste Certificate →
            </button>
          </div>

          <div style={{ background: "#ffffff", borderRadius: 10, padding: 22, border: "1px solid #e5e7eb", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>💰</div>
            <h3 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 700, color: "#111827" }}>Income Certificate</h3>
            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
              Annual family income verification certificate with 1 Financial Year validity, used for college fee reimbursement, scholarships, and admissions.
            </p>
            <button
              onClick={() => navigate("/certificate?type=income")}
              style={{ background: "#047857", color: "#ffffff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}
            >
              Apply for Income Certificate →
            </button>
          </div>
        </div>

        {/* My Applications Tracker */}
        <div style={{ background: "#ffffff", borderRadius: 12, padding: 24, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
              My MeeSeva Applications & Credentials
            </h2>
            <button
              onClick={loadApplications}
              style={{ background: "none", border: "none", color: "#047857", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              ↻ Refresh Status
            </button>
          </div>

          {error && <p style={{ color: "#b91c1c", fontSize: 14 }}>{error}</p>}

          {loading ? (
            <p style={{ color: "#6b7280", fontSize: 14 }}>Loading applications from MeeSeva registry...</p>
          ) : applications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <h3 style={{ margin: "0 0 6px 0", color: "#374151" }}>No Applications Submitted Yet</h3>
              <p style={{ margin: "0 0 16px 0", fontSize: 14 }}>You haven't submitted any certificate applications from this wallet address.</p>
              <button
                onClick={() => navigate("/certificate")}
                style={{ background: "#047857", color: "#ffffff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}
              >
                Start First Application
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {applications.map((app) => {
                const stageInfo = STAGE_CONFIG[app.stage] || STAGE_CONFIG[1];
                return (
                  <div
                    key={app.applicationId}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      padding: 20,
                      background: "#fafafa"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#1e3a8a", background: "#dbeafe", padding: "2px 8px", borderRadius: 4 }}>
                            {app.applicationId}
                          </span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                            {app.categoryName || "Certificate Application"}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: "#4b5563", marginTop: 4 }}>
                          Applicant: <strong>{app.applicantName}</strong> (S/o, D/o {app.fatherName}) • {app.mandal}, {app.district}
                        </div>
                      </div>

                      <div style={{
                        background: stageInfo.bg,
                        color: stageInfo.color,
                        padding: "6px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        border: `1px solid ${stageInfo.color}40`
                      }}>
                        {stageInfo.label}
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, margin: "14px 0", textAlign: "center" }}>
                      <div style={{ background: app.stage >= 1 ? "#ecfdf5" : "#f3f4f6", border: `1px solid ${app.stage >= 1 ? "#10b981" : "#d1d5db"}`, borderRadius: 6, padding: "8px 4px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: app.stage >= 1 ? "#047857" : "#6b7280" }}>1. VRO INQUIRY</div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>{app.stage >= 2 ? "✓ Verified" : app.stage === 1 ? "In Progress" : "Pending"}</div>
                      </div>
                      <div style={{ background: app.stage >= 2 ? "#ecfdf5" : "#f3f4f6", border: `1px solid ${app.stage >= 2 ? "#10b981" : "#d1d5db"}`, borderRadius: 6, padding: "8px 4px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: app.stage >= 2 ? "#047857" : "#6b7280" }}>2. RI SCRUTINY</div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>{app.stage >= 3 ? "✓ Endorsed" : app.stage === 2 ? "In Progress" : "Pending"}</div>
                      </div>
                      <div style={{ background: app.stage >= 4 ? "#ecfdf5" : "#f3f4f6", border: `1px solid ${app.stage >= 4 ? "#10b981" : "#d1d5db"}`, borderRadius: 6, padding: "8px 4px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: app.stage >= 4 ? "#047857" : "#6b7280" }}>3. TAHSILDAR DSC</div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>{app.stage === 4 ? "✓ Digitally Signed" : "Pending"}</div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb", flexWrap: "wrap", gap: 10 }}>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Submitted on: {new Date(app.createdAt).toLocaleDateString()} • Doc Hash: <span style={{ fontFamily: "monospace" }}>{(app.documentHash || "").slice(0, 10)}...</span>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        {/* Audit Timeline Button */}
                        <button
                          onClick={() => setSelectedTimelineApp(app)}
                          style={{
                            background: "#f1f5f9",
                            color: "#334155",
                            border: "1px solid #cbd5e1",
                            borderRadius: 6,
                            padding: "6px 12px",
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          ⏱️ View Statutory Timeline
                        </button>

                        {app.stage === 4 ? (
                          <>
                            <button
                              onClick={() => navigate(`/certificate/${app.applicationId}`)}
                              style={{
                                background: "#047857",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: 6,
                                padding: "6px 14px",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              📄 View Certificate
                            </button>
                            <button
                              onClick={() => navigate(`/verify/${app.applicationId}`)}
                              style={{
                                background: "#ffffff",
                                color: "#374151",
                                border: "1px solid #d1d5db",
                                borderRadius: 6,
                                padding: "6px 12px",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              Scan QR
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>
                            ● Processing with Revenue Dept
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Visual Audit Timeline Modal */}
        {selectedTimelineApp && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20
          }}>
            <div style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, borderBottom: "1px solid #e5e7eb", paddingBottom: 12 }}>
                <div>
                  <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, background: "#dbeafe", color: "#1e3a8a", padding: "2px 6px", borderRadius: 4 }}>
                    {selectedTimelineApp.applicationId}
                  </span>
                  <h3 style={{ margin: "4px 0 0 0", fontSize: 18, fontWeight: 800, color: "#111827" }}>
                    Statutory Revenue Chain of Custody
                  </h3>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Applicant: {selectedTimelineApp.applicantName} • {selectedTimelineApp.categoryName}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTimelineApp(null)}
                  style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}
                >
                  ✕
                </button>
              </div>

              {/* Steps Progression */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>

                {/* Step 1: Citizen */}
                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                      ✓
                    </div>
                    <div style={{ width: 2, height: 40, background: "#cbd5e1", marginTop: 4 }}></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>1. Application Lodgement (Citizen / Kiosk)</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Date: {new Date(selectedTimelineApp.createdAt).toLocaleString()}</div>
                    <div style={{ fontSize: 11, fontFamily: "monospace", color: "#475569", marginTop: 2 }}>
                      Bundle Root: {(selectedTimelineApp.documentHash || "").slice(0, 20)}...
                    </div>
                  </div>
                </div>

                {/* Step 2: VRO */}
                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: selectedTimelineApp.stage >= 2 ? "#10b981" : "#f59e0b",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold"
                    }}>
                      {selectedTimelineApp.stage >= 2 ? "✓" : "2"}
                    </div>
                    <div style={{ width: 2, height: 40, background: "#cbd5e1", marginTop: 4 }}></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                      2. Stage 1: Village Revenue Officer (VRO) Field Inquiry
                    </div>
                    <div style={{ fontSize: 12, color: selectedTimelineApp.stage >= 2 ? "#047857" : "#d97706", fontWeight: 600 }}>
                      {selectedTimelineApp.stage >= 2 ? "Field Inspection Completed & Verified" : "Pending Village Inquiry"}
                    </div>
                    {selectedTimelineApp.history?.find(h => h.stage === 2) && (
                      <div style={{ fontSize: 12, color: "#334155", background: "#f8fafc", padding: "6px 10px", borderRadius: 4, marginTop: 4 }}>
                        "{selectedTimelineApp.history.find(h => h.stage === 2).remarks}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: RI */}
                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: selectedTimelineApp.stage >= 3 ? "#10b981" : "#f59e0b",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold"
                    }}>
                      {selectedTimelineApp.stage >= 3 ? "✓" : "3"}
                    </div>
                    <div style={{ width: 2, height: 40, background: "#cbd5e1", marginTop: 4 }}></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                      3. Stage 2: Revenue Inspector (RI) Scrutiny
                    </div>
                    <div style={{ fontSize: 12, color: selectedTimelineApp.stage >= 3 ? "#047857" : "#d97706", fontWeight: 600 }}>
                      {selectedTimelineApp.stage >= 3 ? "Revenue Registers & Survey Records Endorsed" : "Pending RI Scrutiny"}
                    </div>
                    {selectedTimelineApp.history?.find(h => h.stage === 3) && (
                      <div style={{ fontSize: 12, color: "#334155", background: "#f8fafc", padding: "6px 10px", borderRadius: 4, marginTop: 4 }}>
                        "{selectedTimelineApp.history.find(h => h.stage === 3).remarks}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 4: Tahsildar */}
                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: selectedTimelineApp.stage === 4 ? "#10b981" : "#e2e8f0",
                    color: selectedTimelineApp.stage === 4 ? "#fff" : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold"
                  }}>
                    {selectedTimelineApp.stage === 4 ? "✓" : "4"}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                      4. Stage 3: Tahsildar / MRO Digital Signature & Issuance
                    </div>
                    <div style={{ fontSize: 12, color: selectedTimelineApp.stage === 4 ? "#047857" : "#64748b", fontWeight: 600 }}>
                      {selectedTimelineApp.stage === 4 ? "Approved & Digitally Issued on Blockchain" : "Awaiting Tahsildar Approval"}
                    </div>
                    {selectedTimelineApp.stage === 4 && (
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: "#047857", marginTop: 4 }}>
                        DSC Certified Signer: {(selectedTimelineApp.tahsildar || "0x90F7...07a6").slice(0, 16)}...
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <div style={{ textAlign: "right", marginTop: 18, borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
                <button
                  onClick={() => setSelectedTimelineApp(null)}
                  style={{ background: "#047857", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                >
                  Close Timeline
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
