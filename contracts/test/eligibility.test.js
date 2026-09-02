const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EligibilityRegistry (Telangana MeeSeva 3-Tier)", function () {
  let registry, admin, vro, ri, tahsildar, citizen, stranger;
  const VRO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VRO_ROLE"));
  const RI_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RI_ROLE"));
  const TAHSILDAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TAHSILDAR_ROLE"));

  beforeEach(async function () {
    [admin, vro, ri, tahsildar, citizen, stranger] = await ethers.getSigners();
    const EligibilityRegistry = await ethers.getContractFactory("EligibilityRegistry");
    registry = await EligibilityRegistry.deploy(admin.address);
    await registry.waitForDeployment();

    // Grant roles
    await registry.addOfficer(VRO_ROLE, vro.address);
    await registry.addOfficer(RI_ROLE, ri.address);
    await registry.addOfficer(TAHSILDAR_ROLE, tahsildar.address);
  });

  it("completes the full 3-tier approval chain: Citizen -> VRO -> RI -> Tahsildar", async function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("demo-metadata-hash"));
    const appId = "TS-CGC-2026-0001";

    // 1. Citizen Submits
    await expect(registry.connect(citizen).submitApplication(appId, 1, docHash, 0))
      .to.emit(registry, "ApplicationSubmitted")
      .withArgs(appId, citizen.address, 1, docHash);

    let app = await registry.getApplication(appId);
    expect(app.stage).to.equal(1); // Submitted
    expect(await registry.isCertificateValid(appId)).to.equal(false);

    // 2. VRO Verifies
    await expect(registry.connect(vro).verifyByVRO(appId, true, "Local field inquiry completed; records verified"))
      .to.emit(registry, "VROVerified")
      .withArgs(appId, vro.address, true, "Local field inquiry completed; records verified");

    app = await registry.getApplication(appId);
    expect(app.stage).to.equal(2); // VRO_Verified

    // 3. RI Endorses
    await expect(registry.connect(ri).endorseByRI(appId, true, "Survey and revenue records cross-verified"))
      .to.emit(registry, "RIEndorsed")
      .withArgs(appId, ri.address, true, "Survey and revenue records cross-verified");

    app = await registry.getApplication(appId);
    expect(app.stage).to.equal(3); // RI_Endorsed

    // 4. Tahsildar Issues
    await expect(registry.connect(tahsildar).issueByTahsildar(appId, true, "Digitally signed by Tahsildar"))
      .to.emit(registry, "CertificateIssued")
      .withArgs(appId, tahsildar.address, 0, "Digitally signed by Tahsildar");

    app = await registry.getApplication(appId);
    expect(app.stage).to.equal(4); // Issued
    expect(await registry.isCertificateValid(appId)).to.equal(true);
    expect(await registry.isBeneficiaryEligible(citizen.address, 1)).to.equal(true);
  });

  it("handles rejection by VRO", async function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("demo-doc"));
    const appId = "TS-INC-2026-0002";

    await registry.connect(citizen).submitApplication(appId, 2, docHash, 0);

    await expect(registry.connect(vro).verifyByVRO(appId, false, "Applicant not residing in village"))
      .to.emit(registry, "ApplicationRejected");

    const app = await registry.getApplication(appId);
    expect(app.stage).to.equal(5); // Rejected
    expect(await registry.isCertificateValid(appId)).to.equal(false);
  });

  it("blocks non-officer from acting on applications", async function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("demo-doc"));
    const appId = "TS-CGC-2026-0003";

    await registry.connect(citizen).submitApplication(appId, 1, docHash, 0);

    await expect(
      registry.connect(stranger).verifyByVRO(appId, true, "Fraudulent approval")
    ).to.be.reverted;
  });

  it("allows Tahsildar to revoke an issued certificate", async function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("demo-doc"));
    const appId = "TS-CGC-2026-0004";

    await registry.connect(citizen).submitApplication(appId, 1, docHash, 0);
    await registry.connect(vro).verifyByVRO(appId, true, "OK");
    await registry.connect(ri).endorseByRI(appId, true, "OK");
    await registry.connect(tahsildar).issueByTahsildar(appId, true, "Approved");

    expect(await registry.isCertificateValid(appId)).to.equal(true);

    // Revocation
    await expect(registry.connect(tahsildar).revokeCertificate(appId, "Discovered fraudulent lineage records"))
      .to.emit(registry, "CertificateRevoked")
      .withArgs(appId, tahsildar.address, "Discovered fraudulent lineage records");

    expect(await registry.isCertificateValid(appId)).to.equal(false);
    expect(await registry.isBeneficiaryEligible(citizen.address, 1)).to.equal(false);
  });
});
