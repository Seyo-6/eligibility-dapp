const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("DEPLOYER_PRIVATE_KEY is not configured");

  console.log("Deploying EligibilityRegistry to Sepolia with:", deployer.address);
  const Registry = await hre.ethers.getContractFactory("EligibilityRegistry");
  const registry = await Registry.deploy(deployer.address);
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const tx = registry.deploymentTransaction();
  console.log("EligibilityRegistry:", address);
  console.log("Deployment transaction:", tx?.hash);

  const verifier = process.env.SEPOLIA_VERIFIER_ADDRESS || deployer.address;
  const roleTx = await registry.addVerifier(verifier);
  await roleTx.wait();
  console.log("Verifier granted:", verifier);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
