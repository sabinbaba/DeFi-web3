const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Starting deployment with account:", deployer.address);

  // 1. Get the contract factory for V1
  const DeFiVaultV1 = await ethers.getContractFactory("DeFiVaultV1");

  console.log("Deploying DeFiVaultV1 as a UUPS Proxy...");
  
  // 2. Deploy the proxy. The array [deployer.address] passes the owner argument to initialize()
  const vault = await upgrades.deployProxy(DeFiVaultV1, [deployer.address], {
    kind: "uups",
  });

  await vault.waitForDeployment();
  const proxyAddress = await vault.getAddress();

  console.log("✅ DeFiVaultV1 Proxy deployed to:", proxyAddress);
  console.log("⚠️ IMPORTANT: Copy this proxy address. You will need it for the upgrade script and your GitHub documentation.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});