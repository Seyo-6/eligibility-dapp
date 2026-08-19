const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1. Mock stablecoin (local testing only — swap for a real token address on testnet/mainnet)
  const MockStablecoin = await hre.ethers.getContractFactory("MockStablecoin");
  const token = await MockStablecoin.deploy(hre.ethers.parseUnits("1000000", 18));
  await token.waitForDeployment();
  console.log("MockStablecoin deployed to:", await token.getAddress());

  // 2. Eligibility registry
  const EligibilityRegistry = await hre.ethers.getContractFactory("EligibilityRegistry");
  const registry = await EligibilityRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  console.log("EligibilityRegistry deployed to:", await registry.getAddress());

  // 3. Disbursement contract (100 mUSD per payout, 30 day interval by default)
  const DisbursementContract = await hre.ethers.getContractFactory("DisbursementContract");
  const disbursement = await DisbursementContract.deploy(
    deployer.address,
    await registry.getAddress(),
    await token.getAddress(),
    hre.ethers.parseUnits("100", 18)
  );
  await disbursement.waitForDeployment();
  console.log("DisbursementContract deployed to:", await disbursement.getAddress());

  // 4. Fund the disbursement contract so it can actually pay out
  await token.transfer(await disbursement.getAddress(), hre.ethers.parseUnits("50000", 18));
  console.log("Funded DisbursementContract with 50,000 mUSD");

  // 5. Grant deployer the verifier role on the registry (for local testing convenience)
  await registry.addVerifier(deployer.address);
  console.log("Deployer granted VERIFIER_ROLE");

  console.log("\nDeployment summary:");
  console.log({
    token: await token.getAddress(),
    registry: await registry.getAddress(),
    disbursement: await disbursement.getAddress(),
    deployer: deployer.address
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
