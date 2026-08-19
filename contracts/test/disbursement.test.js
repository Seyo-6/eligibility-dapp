const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DisbursementContract", function () {
  let token, registry, disbursement, admin, beneficiary;

  beforeEach(async function () {
    [admin, beneficiary] = await ethers.getSigners();

    const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
    token = await MockStablecoin.deploy(ethers.parseUnits("1000000", 18));
    await token.waitForDeployment();

    const EligibilityRegistry = await ethers.getContractFactory("EligibilityRegistry");
    registry = await EligibilityRegistry.deploy(admin.address);
    await registry.waitForDeployment();
    await registry.addVerifier(admin.address);

    const DisbursementContract = await ethers.getContractFactory("DisbursementContract");
    disbursement = await DisbursementContract.deploy(
      admin.address,
      await registry.getAddress(),
      await token.getAddress(),
      ethers.parseUnits("100", 18)
    );
    await disbursement.waitForDeployment();

    await token.transfer(await disbursement.getAddress(), ethers.parseUnits("1000", 18));
  });

  it("refuses to pay an unverified beneficiary", async function () {
    await expect(
      disbursement.connect(admin).disburse(beneficiary.address)
    ).to.be.revertedWith("Not eligible");
  });

  it("pays an eligible beneficiary and updates state", async function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("doc"));
    await registry.connect(beneficiary).submitClaim(docHash, 1);
    await registry.connect(admin).reviewClaim(beneficiary.address, true);

    await expect(disbursement.connect(admin).disburse(beneficiary.address))
      .to.emit(disbursement, "Disbursed")
      .withArgs(beneficiary.address, ethers.parseUnits("100", 18));

    expect(await token.balanceOf(beneficiary.address)).to.equal(ethers.parseUnits("100", 18));
  });

  it("blocks a second disbursement before the interval elapses", async function () {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("doc"));
    await registry.connect(beneficiary).submitClaim(docHash, 1);
    await registry.connect(admin).reviewClaim(beneficiary.address, true);

    await disbursement.connect(admin).disburse(beneficiary.address);

    await expect(
      disbursement.connect(admin).disburse(beneficiary.address)
    ).to.be.revertedWith("Too soon since last disbursement");
  });
});
