const hre = require("hardhat");

async function main() {
  const [deployer, vro, ri, tahsildar] = await hre.ethers.getSigners();
  console.log("==================================================");
  console.log("Deploying Telangana MeeSeva Certificate Registry");
  console.log("==================================================");
  console.log("Deployer / Admin:", deployer.address);

  // Deploy Eligibility Registry (Telangana MeeSeva 3-Tier)
  const EligibilityRegistry = await hre.ethers.getContractFactory("EligibilityRegistry");
  const registry = await EligibilityRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✓ EligibilityRegistry deployed to:", registryAddress);

  // Grant 3-Tier Revenue Officer Roles
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

  console.log("\n==================================================");
  console.log("Deployment Summary for .env:");
  console.log("==================================================");
  console.log(`ELIGIBILITY_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`VRO_ADDRESS=${vroAddress}`);
  console.log(`RI_ADDRESS=${riAddress}`);
  console.log(`TAHSILDAR_ADDRESS=${tahsildarAddress}`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
