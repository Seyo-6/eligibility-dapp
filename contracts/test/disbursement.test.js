const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DisbursementContract (Telangana DBT Schemes)", function () {
  let token, registry, disbursement, admin, vro, ri, tahsildar, beneficiary;
  const VRO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VRO_ROLE"));
  const RI_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RI_ROLE"));
  const TAHSILDAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TAHSILDAR_ROLE"));

  beforeEach(async function () {
    [admin, vro, ri, tahsildar, beneficiary] = await ethers.getSigners();

    const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
    token = await MockStablecoin.deploy(ethers.parseUnits("1000000", 18));
    await token.waitForDeployment();

    const EligibilityRegistry = await ethers.getContractFactory("EligibilityRegistry");
    registry = await EligibilityRegistry.deploy(admin.address);
    await registry.waitForDeployment();

    await registry.addOfficer(VRO_ROLE, vro.address);
    await registry.addOfficer(RI_ROLE, ri.address);
    await registry.addOfficer(TAHSILDAR_ROLE, tahsildar.address);

    const DisbursementContract = await ethers.getContractFactory("DisbursementContract");
    disbursement = await DisbursementContract.deploy(
      admin.address,
      await registry.getAddress(),
      await token.getAddress()
    );
    await disbursement.waitForDeployment();

    // Fund the DBT contract
    await token.transfer(await disbursement.getAddress(), ethers.parseUnits("10000", 18));
  });

  it("refuses DBT scholarship claim to an unverified citizen", async function () {
    const [eligible, reason] = await disbursement.canClaim(beneficiary.address, 1);
    expect(eligible).to.equal(false);
    expect(reason).to.equal("Missing valid required MeeSeva certificate");

    await expect(
      disbursement.connect(beneficiary).claimDisbursement(1)
    ).to.be.revertedWith("Beneficiary does not possess a valid required MeeSeva certificate");
  });

  it("allows eligible beneficiary to claim ePASS scholarship once certificate is issued", async function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("doc"));
    const appId = "TS-CGC-2026-0010";

    // Complete MeeSeva 3-Tier Issuance for Category 1 (Caste)
    await registry.connect(beneficiary).submitApplication(appId, 1, docHash, 0);
    await registry.connect(vro).verifyByVRO(appId, true, "Verified");
    await registry.connect(ri).endorseByRI(appId, true, "Endorsed");
    await registry.connect(tahsildar).issueByTahsildar(appId, true, "Issued");

    const [eligible] = await disbursement.canClaim(beneficiary.address, 1);
    expect(eligible).to.equal(true);

    // Beneficiary self-claims scholarship
    const scholarshipAmount = ethers.parseUnits("250", 18);
    await expect(disbursement.connect(beneficiary).claimDisbursement(1))
      .to.emit(disbursement, "Disbursed")
      .withArgs(beneficiary.address, 1, scholarshipAmount);

    expect(await token.balanceOf(beneficiary.address)).to.equal(scholarshipAmount);
  });

  it("blocks rapid double claim within interval", async function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("doc"));
    const appId = "TS-CGC-2026-0011";

    await registry.connect(beneficiary).submitApplication(appId, 1, docHash, 0);
    await registry.connect(vro).verifyByVRO(appId, true, "Verified");
    await registry.connect(ri).endorseByRI(appId, true, "Endorsed");
    await registry.connect(tahsildar).issueByTahsildar(appId, true, "Issued");

    await disbursement.connect(beneficiary).claimDisbursement(1);

    await expect(
      disbursement.connect(beneficiary).claimDisbursement(1)
    ).to.be.revertedWith("Disbursement interval cooldown active");
  });
});
