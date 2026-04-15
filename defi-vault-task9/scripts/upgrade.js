const { ethers, upgrades } = require("hardhat");

// ⚠️ PASTE YOUR PROXY ADDRESS FROM DEPLOY.JS HERE
const PROXY_ADDRESS = "0x62e2F840B0d16823f3071c019333f7255259BD86";

async function main() {
  if (PROXY_ADDRESS === "0x_PASTE_YOUR_PROXY_ADDRESS_HERE") {
    throw new Error("Please set the PROXY_ADDRESS variable before running this script.");
  }

  console.log("Starting upgrade process...");
  console.log("Target Proxy Address:", PROXY_ADDRESS);

  // 1. Get the contract factory for V2
  const DeFiVaultV2 = await ethers.getContractFactory("DeFiVaultV2");

  console.log("Upgrading Logic Contract to V2...");
  
  // 2. Upgrade the proxy to point to the new V2 implementation
  const upgradedVault = await upgrades.upgradeProxy(PROXY_ADDRESS, DeFiVaultV2);
  await upgradedVault.waitForDeployment();

  console.log("✅ Successfully upgraded to DeFiVaultV2!");
  
  // 3. Verify the upgrade worked by calling the new version() function
  const version = await upgradedVault.version();
  console.log("Current Live Version:", version);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});