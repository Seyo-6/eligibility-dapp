const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EligibilityRegistry", function () {
  let registry, admin, verifier, beneficiary, stranger;

  beforeEach(async function () {
    [admin, verifier, beneficiary, stranger] = await ethers.getSigners();
    const EligibilityRegistry = await ethers.getContractFactory("EligibilityRegistry");
    registry = await EligibilityRegistry.deploy(admin.address);
    await registry.waitForDeployment();
    await registry.addVerifier(verifier.address);
  });

  it("lets a beneficiary submit a claim", async function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("ipfs-cid-placeholder"));
    await expect(registry.connect(beneficiary).submitClaim(docHash, 1))
      .to.emit(registry, "ClaimSubmitted")
      .withArgs(beneficiary.address, 1, docHash);

    const claim = await registry.getClaim(beneficiary.address);
    expect(claim.status).to.equal(1); // Pending
  });

  it("lets a verifier approve a pending claim", async function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("doc"));
    await registry.connect(beneficiary).submitClaim(docHash, 1);

    await expect(registry.connect(verifier).reviewClaim(beneficiary.address, true))
      .to.emit(registry, "ClaimReviewed")
      .withArgs(beneficiary.address, verifier.address, true);

    expect(await registry.isEligible(beneficiary.address)).to.equal(true);
  });

  it("rejects review from a non-verifier", async function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("doc"));
    await registry.connect(beneficiary).submitClaim(docHash, 1);

    await expect(
      registry.connect(stranger).reviewClaim(beneficiary.address, true)
    ).to.be.reverted;
  });

  it("does not allow reviewing a claim that was never submitted", async function () {
    await expect(
      registry.connect(verifier).reviewClaim(stranger.address, true)
    ).to.be.revertedWith("No pending claim");
  });

  it("blocks a re-submission once approved", async function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("doc"));
    await registry.connect(beneficiary).submitClaim(docHash, 1);
    await registry.connect(verifier).reviewClaim(beneficiary.address, true);

    await expect(
      registry.connect(beneficiary).submitClaim(docHash, 1)
    ).to.be.revertedWith("Already approved");
  });
});
