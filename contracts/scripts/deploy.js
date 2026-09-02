const hre = require("hardhat");

async function main() {
  const [deployer, vro, ri, tahsildar, citizen] = await hre.ethers.getSigners();
  console.log("==================================================");
  console.log("Deploying Telangana MeeSeva Blockchain DApp System");
  console.log("==================================================");
  console.log("Deployer / Admin:", deployer.address);

  // 1. Mock Stablecoin (for DBT scholarship & welfare transfers)
  const MockStablecoin = await hre.ethers.getContractFactory("MockStablecoin");
  const token = await MockStablecoin.deploy(hre.ethers.parseUnits("1000000", 18));
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✓ MockStablecoin (mUSD) deployed to:", tokenAddress);

  // 2. Eligibility Registry (Telangana MeeSeva 3-Tier)
  const EligibilityRegistry = await hre.ethers.getContractFactory("EligibilityRegistry");
  const registry = await EligibilityRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✓ EligibilityRegistry deployed to:", registryAddress);

  // 3. Grant 3-Tier Roles
  const VRO_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("VRO_ROLE"));
  const RI_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RI_ROLE"));
  const TAHSILDAR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("TAHSILDAR_ROLE"));

  const vroAddress = vro ? vro.address : deployer.address;
  const riAddress = ri ? ri.address : deployer.address;
  const tahsildarAddress = tahsildar ? tahsildar.address : deployer.address;

  await registry.addOfficer(VRO_ROLE, vroAddress);
  await registry.addOfficer(RI_ROLE, riAddress);
  await registry.addOfficer(TAHSILDAR_ROLE, tahsildarAddress);
  console.log(`✓ Roles granted:\n   - VRO: ${vroAddress}\n   - RI: ${riAddress}\n   - Tahsildar: ${tahsildarAddress}`);

  // 4. Disbursement Contract (DBT Schemes)
  const DisbursementContract = await hre.ethers.getContractFactory("DisbursementContract");
  const disbursement = await DisbursementContract.deploy(
    deployer.address,
    registryAddress,
    tokenAddress
  );
  await disbursement.waitForDeployment();
  const disbursementAddress = await disbursement.getAddress();
  console.log("✓ DisbursementContract (DBT) deployed to:", disbursementAddress);

  // 5. Fund the DBT Contract with 50,000 mUSD
  await token.transfer(disbursementAddress, hre.ethers.parseUnits("50000", 18));
  console.log("✓ Funded DisbursementContract with 50,000 mUSD for DBT payouts");

  console.log("\n==================================================");
  console.log("Deployment Summary for .env:");
  console.log("==================================================");
  console.log(`ELIGIBILITY_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`DISBURSEMENT_CONTRACT_ADDRESS=${disbursementAddress}`);
  console.log(`TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`VRO_ADDRESS=${vroAddress}`);
  console.log(`RI_ADDRESS=${riAddress}`);
  console.log(`TAHSILDAR_ADDRESS=${tahsildarAddress}`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
