import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSession, authedFetch, submitApplicationOnChain } from "../services/wallet";
import Navbar from "../components/Navbar";

const TELANGANA_DISTRICTS = [
  "Hyderabad",
  "Rangareddy",
  "Medchal-Malkajgiri",
  "Warangal Urban",
  "Warangal Rural",
  "Karimnagar",
  "Nalgonda",
  "Khammam",
  "Nizamabad",
  "Sangareddy",
  "Siddipet",
  "Mahabubnagar",
  "Adilabad",
  "Bhadradri Kothagudem",
  "Jagtial",
  "Jangaon",
  "Jayashankar Bhupalpally",
  "Jogulamba Gadwal",
  "Kamareddy",
  "Kumuram Bheem Asifabad",
  "Mahabubabad",
  "Mancherial",
  "Medak",
  "Mulugu",
  "Nagarkurnool",
  "Narayanpet",
  "Nirmal",
  "Peddapalli",
  "Rajanna Sircilla",
  "Suryapet",
  "Vikarabad",
  "Wanaparthy",
  "Yadadri Bhuvanagiri"
];

const MANDALS = {
  Hyderabad: ["Shaikpet", "Khairatabad", "Secunderabad", "Asifnagar", "Bahadurpura", "Bandlaguda", "Golconda", "Musheerabad", "Nampally", "Saidabad"],
  Rangareddy: ["Serilingampally", "Rajendranagar", "Gandipet", "Ibrahimpatnam", "Maheshwaram", "Shamshabad", "Chevella", "Moinabad", "Shadnagar"],
  "Medchal-Malkajgiri": ["Malkajgiri", "Alwal", "Kukatpally", "Quthbullapur", "Bachupally", "Medchal", "Ghatkesar", "Keesara", "Kapra"],
  default: ["Mandal Headquarter", "North Mandal", "South Mandal", "Central Mandal", "Rural Mandal"]
};

const CERT_TYPES = {
  caste: { id: 1, label: "Caste & Community Certificate", icon: "📜", desc: "For SC, ST, BC, and OC community attestation." },
  income: { id: 2, label: "Income Certificate", icon: "💰", desc: "Annual household income verification for scholarships & welfare." },
  residence: { id: 3, label: "Residence & Nativity Certificate", icon: "🏡", desc: "Proof of continuous residence/domicile in Telangana state." },
  ews: { id: 4, label: "EWS Eligibility Certificate", icon: "🏛️", desc: "Economically Weaker Section certificate for non-reserved categories." }
};

export default function CertificateApplication() {
  const session = getSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialType = params.get("type") || "caste";

  const [selectedType, setSelectedType] = useState(initialType);
  const [form, setForm] = useState({
    applicantName: "",
    fatherName: "",
    gender: "Male",
    dob: "2000-01-01",
    aadhaarMasked: "XXXX-XXXX-8921",
    district: "Hyderabad",
    mandal: "Shaikpet",
    village: "Tolichowki",
    pincode: "500008",
    casteGroup: "BC-B",
    subCaste: "Padmashali",
    annualIncome: "120000",
    incomeSource: "Agriculture & Small Enterprise",
    purpose: "State Scholarship / Academic Admission",
    residenceYears: "18"
  });

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState(null);
  const [submittedApp, setSubmittedApp] = useState(null);

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Navbar />
        <div style={{ maxWidth: 500, margin: "60px auto", textAlign: "center", padding: 20 }}>
          <h2>Please Connect Wallet First</h2>
          <button onClick={() => navigate("/")} style={{ background: "#047857", color: "white", padding: "10px 20px", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  function updateField(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleFileUpload(docType, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = e.target.result;
      const fakeHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.type !== docType);
        return [...filtered, { name: file.name, type: docType, hash: fakeHash, fileData }];
      });
    };
    reader.readAsDataURL(file);
  }

  const currentMandals = MANDALS[form.district] || MANDALS.default;
  const currentCert = CERT_TYPES[selectedType] || CERT_TYPES.caste;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setStatusMessage("");
    setLoading(true);

    try {
      setStatusMessage("1/3: Preparing canonical metadata and cryptographic document bundle...");

      const payload = {
        category: currentCert.id,
        applicantName: form.applicantName,
        fatherName: form.fatherName,
        gender: form.gender,
        dob: form.dob,
        aadhaarMasked: form.aadhaarMasked,
        district: form.district,
        mandal: form.mandal,
        village: form.village,
        pincode: form.pincode,
        casteGroup: form.casteGroup,
        subCaste: form.subCaste,
        annualIncome: form.annualIncome,
        purpose: form.purpose,
        documents: documents.length > 0 ? documents : [
          { name: "applicant_photo.jpg", type: "PASSPORT_PHOTO", hash: "0x89ab...cd" },
          { name: "aadhaar_card_masked.pdf", type: "IDENTITY_PROOF", hash: "0x12cd...ef" },
          { name: "ration_card.pdf", type: "RATION_CARD", hash: "0x45ef...01" }
        ]
      };

      // 1. Send to Backend
      const res = await authedFetch("/applications/apply", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register application draft");

      const { applicationId, documentHash, category, validUntil } = data;

      // 2. Submit on-chain to EligibilityRegistry
      setStatusMessage(`2/3: Lodging on-chain claim for ${applicationId} on Ethereum...`);
      const txHash = await submitApplicationOnChain(applicationId, category, documentHash, validUntil);

      setStatusMessage(`3/3: Application successfully registered on MeeSeva Blockchain!`);
      setSubmittedApp({ applicationId, txHash, ...data.application });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: 860, margin: "32px auto", padding: "0 20px" }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{ background: "none", border: "none", color: "#047857", fontWeight: 700, cursor: "pointer", marginBottom: 16, fontSize: 14 }}
        >
          ← Back to Citizen Dashboard
        </button>

        {submittedApp ? (
          <div style={{ background: "#ffffff", borderRadius: 12, padding: 32, border: "1px solid #10b981", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, background: "#d1fae5", color: "#047857", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px auto" }}>
              ✓
            </div>
            <h2 style={{ margin: "0 0 8px 0", color: "#065f46" }}>Application Submitted Successfully!</h2>
            <p style={{ color: "#4b5563", fontSize: 15, margin: "0 0 20px 0" }}>
              Your application has been cryptographically recorded and assigned to the local Village Revenue Officer (VRO) for field inquiry.
            </p>

            <div style={{ background: "#f3f4f6", borderRadius: 8, padding: 20, textAlign: "left", maxWidth: 500, margin: "0 auto 24px auto", fontFamily: "monospace", fontSize: 13 }}>
              <div><strong>Application ID:</strong> {submittedApp.applicationId}</div>
              <div><strong>Service:</strong> {submittedApp.categoryName}</div>
              <div><strong>Applicant:</strong> {submittedApp.applicantName}</div>
              <div><strong>Jurisdiction:</strong> {submittedApp.mandal}, {submittedApp.district}</div>
              <div style={{ wordBreak: "break-all" }}><strong>Document Hash:</strong> {submittedApp.documentHash}</div>
              <div style={{ wordBreak: "break-all" }}><strong>Tx Hash:</strong> {submittedApp.txHash}</div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => navigate("/dashboard")}
                style={{ background: "#047857", color: "white", border: "none", borderRadius: 6, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}
              >
                Track in Dashboard
              </button>
              <button
                onClick={() => { setSubmittedApp(null); setStatusMessage(""); }}
                style={{ background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 6, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}
              >
                Submit Another Application
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: "#ffffff", borderRadius: 12, padding: 32, border: "1px solid #e5e7eb", boxShadow: "0 2px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 16, marginBottom: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Telangana Revenue Department • Citizen e-Services
              </span>
              <h1 style={{ margin: "4px 0 0 0", fontSize: 24, fontWeight: 800, color: "#111827" }}>
                Online Certificate Application Form
              </h1>
            </div>

            {/* Step 1: Certificate Type Selector */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
                1. Select Certificate Service
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                {Object.entries(CERT_TYPES).map(([key, item]) => (
                  <div
                    key={key}
                    onClick={() => setSelectedType(key)}
                    style={{
                      border: selectedType === key ? "2px solid #047857" : "1px solid #d1d5db",
                      background: selectedType === key ? "#ecfdf5" : "#ffffff",
                      borderRadius: 8,
                      padding: "12px 14px",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  >
                    <div style={{ fontSize: 20 }}>{item.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#111827", marginTop: 4 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 2: Applicant Personal Details */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
                  2. Applicant & Family Details
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Full Name (as per SSC / Aadhaar)*</span>
                    <input
                      required
                      value={form.applicantName}
                      onChange={(e) => updateField("applicantName", e.target.value)}
                      placeholder="e.g. Moulik Sharma"
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Father / Mother / Guardian Name*</span>
                    <input
                      required
                      value={form.fatherName}
                      onChange={(e) => updateField("fatherName", e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Date of Birth</span>
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(e) => updateField("dob", e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Masked Aadhaar Number</span>
                    <input
                      value={form.aadhaarMasked}
                      onChange={(e) => updateField("aadhaarMasked", e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Telangana Jurisdiction */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
                  3. Telangana Administrative Jurisdiction
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>District*</span>
                    <select
                      value={form.district}
                      onChange={(e) => {
                        updateField("district", e.target.value);
                        const mandals = MANDALS[e.target.value] || MANDALS.default;
                        updateField("mandal", mandals[0]);
                      }}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, boxSizing: "border-box", background: "#fff" }}
                    >
                      {TELANGANA_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Mandal*</span>
                    <select
                      value={form.mandal}
                      onChange={(e) => updateField("mandal", e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, boxSizing: "border-box", background: "#fff" }}
                    >
                      {currentMandals.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Village / Ward / Locality*</span>
                    <input
                      required
                      value={form.village}
                      onChange={(e) => updateField("village", e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Pincode*</span>
                    <input
                      required
                      value={form.pincode}
                      onChange={(e) => updateField("pincode", e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Category Specific Fields */}
              <div style={{ marginBottom: 24, padding: 16, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
                  4. {currentCert.label} Specific Details
                </label>

                {currentCert.id === 1 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Caste Group*</span>
                      <select
                        value={form.casteGroup}
                        onChange={(e) => updateField("casteGroup", e.target.value)}
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, boxSizing: "border-box", background: "#fff" }}
                      >
                        <option value="SC">Scheduled Caste (SC)</option>
                        <option value="ST">Scheduled Tribe (ST)</option>
                        <option value="BC-A">Backward Class Group A (BC-A)</option>
                        <option value="BC-B">Backward Class Group B (BC-B)</option>
                        <option value="BC-C">Backward Class Group C (BC-C)</option>
                        <option value="BC-D">Backward Class Group D (BC-D)</option>
                        <option value="BC-E">Backward Class Group E (BC-E)</option>
                        <option value="OC">Open Category (OC)</option>
                      </select>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Sub-Caste Name*</span>
                      <input
                        required
                        value={form.subCaste}
                        onChange={(e) => updateField("subCaste", e.target.value)}
                        placeholder="e.g. Mala / Madiga / Padmashali / Yadava / Reddy"
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                ) : currentCert.id === 2 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Total Annual Family Income (INR)*</span>
                      <input
                        type="number"
                        required
                        min="10000"
                        value={form.annualIncome}
                        onChange={(e) => updateField("annualIncome", e.target.value)}
                        placeholder="e.g. 150000"
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Primary Income Source</span>
                      <input
                        value={form.incomeSource}
                        onChange={(e) => updateField("incomeSource", e.target.value)}
                        placeholder="Agriculture, Business, Private Job"
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Purpose of Certificate</span>
                    <input
                      value={form.purpose}
                      onChange={(e) => updateField("purpose", e.target.value)}
                      placeholder="Fee Reimbursement, Job Application, College Admission"
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, boxSizing: "border-box" }}
                    />
                  </div>
                )}
              </div>

              {/* Step 5: Supporting Documents Upload */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
                  5. Upload Supporting Documents (Enclosures)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  <div style={{ border: "1px dashed #d1d5db", padding: 14, borderRadius: 6, textAlign: "center", background: "#fafafa" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>1. Applicant Photo</div>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload("PASSPORT_PHOTO", e.target.files[0])} style={{ fontSize: 11 }} />
                  </div>
                  <div style={{ border: "1px dashed #d1d5db", padding: 14, borderRadius: 6, textAlign: "center", background: "#fafafa" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>2. Identity / Aadhaar</div>
                    <input type="file" accept=".pdf,image/*" onChange={(e) => handleFileUpload("IDENTITY_PROOF", e.target.files[0])} style={{ fontSize: 11 }} />
                  </div>
                  <div style={{ border: "1px dashed #d1d5db", padding: 14, borderRadius: 6, textAlign: "center", background: "#fafafa" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>3. Ration / Food Card</div>
                    <input type="file" accept=".pdf,image/*" onChange={(e) => handleFileUpload("RATION_CARD", e.target.files[0])} style={{ fontSize: 11 }} />
                  </div>
                </div>
              </div>

              {/* Status and Submit */}
              {statusMessage && (
                <div style={{ padding: 12, background: "#ecfdf5", border: "1px solid #10b981", borderRadius: 6, color: "#065f46", fontSize: 13, marginBottom: 16 }}>
                  {statusMessage}
                </div>
              )}

              {error && (
                <div style={{ padding: 12, background: "#fee2e2", border: "1px solid #f87171", borderRadius: 6, color: "#b91c1c", fontSize: 13, marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "#047857",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  padding: "14px 28px",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  width: "100%",
                  boxShadow: "0 2px 4px rgba(4,120,87,0.2)"
                }}
              >
                {loading ? "Processing Statutory Blockchain Submission..." : "✓ Submit Application to Revenue Registry"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

