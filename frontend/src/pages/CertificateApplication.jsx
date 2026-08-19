import { useState } from "react";
import { keccak256, isHexString } from "ethers";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSession, submitClaimFromWallet } from "../services/wallet";

const TYPES = {
  caste: { label: "Caste Certificate", category: 1 },
  income: { label: "Income Certificate", category: 2 }
};

async function hashFile(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return keccak256(bytes);
}

export default function CertificateApplication() {
  const session = getSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const type = TYPES[params.get("type")] || TYPES.caste;
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ name: "", district: "", mandal: "", purpose: "", category: "", annualIncome: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  if (!session) return <p style={{ textAlign: "center", marginTop: 40 }}>Connect MetaMask first.</p>;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!file) return setError("Upload a supporting document for the demo.");
    try {
      setStatus("Hashing document...");
      const documentHash = await hashFile(file);
      if (!isHexString(documentHash, 32)) throw new Error("Could not hash document");
      setStatus("Confirm the claim transaction in MetaMask...");
      const txHash = await submitClaimFromWallet(documentHash, type.category);
      setStatus(`Submitted. Transaction: ${txHash}`);
    } catch (err) {
      setError(err.message || "Submission failed");
      setStatus("");
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: 20 }}>
      <button onClick={() => navigate("/dashboard")}>← Dashboard</button>
      <h1>{type.label}</h1>
      <p>Prototype flow inspired by public Telangana certificate requirements. Do not upload real Aadhaar or other sensitive documents.</p>
      <form onSubmit={submit}>
        <label>Applicant name<br /><input required value={form.name} onChange={(e) => update("name", e.target.value)} /></label><br />
        <label>District<br /><input required value={form.district} onChange={(e) => update("district", e.target.value)} /></label><br />
        <label>Mandal<br /><input value={form.mandal} onChange={(e) => update("mandal", e.target.value)} /></label><br />
        {type.category === 1 ? (
          <label>Caste category<br /><select required value={form.category} onChange={(e) => update("category", e.target.value)}><option value="">Select</option><option>SC</option><option>ST</option><option>BC</option><option>OC</option></select></label>
        ) : (
          <label>Annual income (demo)<br /><input type="number" min="0" value={form.annualIncome} onChange={(e) => update("annualIncome", e.target.value)} /></label>
        )}
        <br />
        <label>Purpose<br /><input value={form.purpose} onChange={(e) => update("purpose", e.target.value)} placeholder="Education / scholarship / other" /></label><br />
        <label>Supporting document (demo)<br /><input required type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label><br />
        <button type="submit">Submit with MetaMask</button>
      </form>
      {status && <p style={{ color: "green", overflowWrap: "anywhere" }}>{status}</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}
