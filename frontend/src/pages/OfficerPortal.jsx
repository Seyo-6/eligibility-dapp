import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, authedFetch, verifyByVROOnChain, endorseByRIOnChain, issueByTahsildarOnChain } from "../services/wallet";
import Navbar from "../components/Navbar";

export default function OfficerPortal() {
  const session = getSession();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(
    session?.role === "ri" ? "ri" : session?.role === "tahsildar" ? "tahsildar" : "vro"
  );
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session) {
      navigate("/");
      return;
    }
    loadQueue();
  }, [activeTab]);

  async function loadQueue() {
    try {
      setLoading(true);
      setError(null);
      const res = await authedFetch(`/applications/queue/${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
        if (data.length > 0 && !selectedApp) setSelectedApp(data[0]);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to load officer queue");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action) {
    if (!selectedApp) return;
    setActionLoading(true);
    setActionStatus("");
    setError(null);

    try {
      let txHash = "";

      if (action === "approve") {
        if (activeTab === "vro") {
          setActionStatus("1/2: Submitting VRO Field Inspection Verification to Blockchain...");
          txHash = await verifyByVROOnChain(selectedApp.applicationId, true, remarks || "Local field inquiry completed; applicant is genuine resident and caste/income records are verified.");
        } else if (activeTab === "ri") {
          setActionStatus("1/2: Submitting RI Revenue Scrutiny Endorsement to Blockchain...");
          txHash = await endorseByRIOnChain(selectedApp.applicationId, true, remarks || "Survey and revenue records cross-verified. Recommended for issuance.");
        } else if (activeTab === "tahsildar") {
          setActionStatus("1/2: Applying Tahsildar Digital Signature & On-Chain Issuance...");
          txHash = await issueByTahsildarOnChain(selectedApp.applicationId, true, remarks || "Approved and digitally signed by Tahsildar / Mandal Revenue Officer.");
        }
      } else if (action === "reject") {
        setActionStatus("Recording rejection remarks on blockchain...");
        if (activeTab === "vro") {
          txHash = await verifyByVROOnChain(selectedApp.applicationId, false, remarks || "Rejected during VRO field inquiry.");
        } else if (activeTab === "ri") {
          txHash = await endorseByRIOnChain(selectedApp.applicationId, false, remarks || "Rejected during RI scrutiny.");
        } else if (activeTab === "tahsildar") {
          txHash = await issueByTahsildarOnChain(selectedApp.applicationId, false, remarks || "Rejected by Tahsildar.");
        }
      }

      setActionStatus("2/2: Updating MeeSeva registry state...");
      const res = await authedFetch(`/applications/${selectedApp.applicationId}/review`, {
        method: "POST",
        body: JSON.stringify({
          action,
          remarks: remarks || `${action.toUpperCase()} by ${activeTab.toUpperCase()}`,
          txHash
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update review status");
      }

      setActionStatus(`✓ Successfully processed application! Transaction: ${txHash.slice(0, 14)}...`);
      setRemarks("");
      setSelectedApp(null);
      loadQueue();
    } catch (err) {
      setError(err.message);
      setActionStatus("");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: "28px auto", padding: "0 20px" }}>
        {/* Officer Role Tabs */}
        <div style={{ background: "#ffffff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Telangana Revenue Administration
            </span>
            <h1 style={{ margin: "2px 0 0 0", fontSize: 22, fontWeight: 800, color: "#111827" }}>
              Revenue Officer Verification Portal
            </h1>
          </div>

          {/* Workflow Stage Switcher */}
          <div style={{ display: "flex", background: "#f3f4f6", padding: 4, borderRadius: 8, gap: 4 }}>
            <button
              onClick={() => { setActiveTab("vro"); setSelectedApp(null); }}
              style={{
                background: activeTab === "vro" ? "#047857" : "transparent",
                color: activeTab === "vro" ? "#ffffff" : "#4b5563",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Stage 1: VRO Queue
            </button>
            <button
              onClick={() => { setActiveTab("ri"); setSelectedApp(null); }}
              style={{
                background: activeTab === "ri" ? "#c2410c" : "transparent",
                color: activeTab === "ri" ? "#ffffff" : "#4b5563",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Stage 2: RI Scrutiny
            </button>
            <button
              onClick={() => { setActiveTab("tahsildar"); setSelectedApp(null); }}
              style={{
                background: activeTab === "tahsildar" ? "#b91c1c" : "transparent",
                color: activeTab === "tahsildar" ? "#ffffff" : "#4b5563",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Stage 3: Tahsildar Issuance
            </button>
          </div>
        </div>

        {/* 2-Column Work Desk */}
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20 }}>
          {/* Left Column: Queue List */}
          <div style={{ background: "#ffffff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16, height: "fit-content" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
                Pending Dossiers ({queue.length})
              </h2>
              <button
                onClick={loadQueue}
                style={{ background: "none", border: "none", color: "#047857", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <p style={{ color: "#6b7280", fontSize: 13 }}>Fetching queue...</p>
            ) : queue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 10px", color: "#6b7280" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No Pending Applications</p>
                <p style={{ margin: "4px 0 0 0", fontSize: 12 }}>All dossiers for this statutory stage have been processed.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {queue.map((app) => (
                  <div
                    key={app.applicationId}
                    onClick={() => setSelectedApp(app)}
                    style={{
                      border: selectedApp?.applicationId === app.applicationId ? "2px solid #047857" : "1px solid #e5e7eb",
                      background: selectedApp?.applicationId === app.applicationId ? "#ecfdf5" : "#fafafa",
                      borderRadius: 8,
                      padding: 12,
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#1e3a8a" }}>
                        {app.applicationId}
                      </span>
                      <span style={{ fontSize: 11, background: "#e0e7ff", color: "#3730a3", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                        {app.categoryName?.split(" ")[0]}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginTop: 4 }}>
                      {app.applicantName}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      {app.mandal}, {app.district}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Active Dossier & Verification Console */}
          <div>
            {selectedApp ? (
              <div style={{ background: "#ffffff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                {/* Dossier Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e5e7eb", paddingBottom: 16, marginBottom: 20 }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, background: "#dbeafe", color: "#1e3a8a", padding: "3px 8px", borderRadius: 4 }}>
                      {selectedApp.applicationId}
                    </span>
                    <h2 style={{ margin: "6px 0 2px 0", fontSize: 20, fontWeight: 800, color: "#111827" }}>
                      {selectedApp.categoryName}
                    </h2>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      Submitted: {new Date(selectedApp.createdAt).toLocaleString()} • Wallet: {selectedApp.beneficiary}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#047857" }}>
                      Current Status: {selectedApp.stageName}
                    </div>
                  </div>
                </div>

                {/* Dossier Data Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20, background: "#f9fafb", padding: 16, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>APPLICANT NAME</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{selectedApp.applicantName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>FATHER / GUARDIAN</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{selectedApp.fatherName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>JURISDICTION</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{selectedApp.village}, {selectedApp.mandal}, {selectedApp.district} (PIN: {selectedApp.pincode})</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>MASKED AADHAAR</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{selectedApp.aadhaarMasked}</div>
                  </div>

                  {selectedApp.category === 1 && (
                    <>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>CASTE GROUP</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#047857" }}>{selectedApp.casteGroup}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>SUB-CASTE</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{selectedApp.subCaste}</div>
                      </div>
                    </>
                  )}

                  {selectedApp.category === 2 && (
                    <>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>ANNUAL FAMILY INCOME</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#047857" }}>₹ {Number(selectedApp.annualIncome).toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>PURPOSE</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{selectedApp.purpose}</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Audit & Workflow History */}
                {selectedApp.history && selectedApp.history.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 700, color: "#374151" }}>
                      Statutory Audit & Endorsement History
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {selectedApp.history.map((h, i) => (
                        <div key={i} style={{ borderLeft: "3px solid #047857", paddingLeft: 10, fontSize: 12 }}>
                          <div style={{ fontWeight: 700, color: "#111827" }}>
                            {h.officerRole}: {h.stageName}
                          </div>
                          <div style={{ color: "#4b5563" }}>"{h.remarks}"</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>
                            By {h.officerAddress?.slice(0, 8)}... on {new Date(h.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Officer Action Box */}
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 18 }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: 15, fontWeight: 700, color: "#111827" }}>
                    Officer Inspection Findings & Endorsement
                  </h3>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={
                      activeTab === "vro"
                        ? "Enter VRO field inquiry remarks (e.g. Applicant nativity confirmed, survey verified)"
                        : activeTab === "ri"
                        ? "Enter RI scrutiny notes (e.g. Cross-verified with revenue registers)"
                        : "Enter Tahsildar approval notes for digital issuance"
                    }
                    style={{ width: "100%", padding: 10, border: "1px solid #d1d5db", borderRadius: 6, boxSizing: "border-box", fontSize: 13 }}
                  />

                  {actionStatus && (
                    <div style={{ margin: "12px 0", padding: 10, background: "#ecfdf5", border: "1px solid #10b981", borderRadius: 6, color: "#065f46", fontSize: 13 }}>
                      {actionStatus}
                    </div>
                  )}

                  {error && (
                    <div style={{ margin: "12px 0", padding: 10, background: "#fee2e2", border: "1px solid #f87171", borderRadius: 6, color: "#b91c1c", fontSize: 13 }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                    <button
                      onClick={() => handleAction("approve")}
                      disabled={actionLoading}
                      style={{
                        background: activeTab === "tahsildar" ? "#047857" : "#1d4ed8",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 6,
                        padding: "10px 20px",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}
                    >
                      {activeTab === "vro" && "✓ Verify & Forward to RI"}
                      {activeTab === "ri" && "✓ Endorse & Forward to Tahsildar"}
                      {activeTab === "tahsildar" && "🔏 Approve & Digitally Issue (DSC)"}
                    </button>

                    <button
                      onClick={() => handleAction("reject")}
                      disabled={actionLoading}
                      style={{
                        background: "#fee2e2",
                        color: "#b91c1c",
                        border: "1px solid #f87171",
                        borderRadius: 6,
                        padding: "10px 18px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: actionLoading ? "not-allowed" : "pointer"
                      }}
                    >
                      ✕ Reject / Raise Shortfall
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: "#ffffff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 40, textAlign: "center", color: "#6b7280" }}>
                Select an application from the pending queue to inspect the citizen dossier and perform statutory verification.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
