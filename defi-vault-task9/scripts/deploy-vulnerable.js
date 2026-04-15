const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Starting deployment with account:", deployer.address);

  // 1. Get the contract factory for the vulnerable contract
  const VulnerableVault = await ethers.getContractFactory("VulnerableVault");

  console.log("Deploying VulnerableVault (Standard Contract)...");
  
  // 2. Deploy it directly (no proxy!)
  const vault = await VulnerableVault.deploy();

  // 3. Wait for the transaction to be mined
  await vault.waitForDeployment();
  const contractAddress = await vault.getAddress();

  console.log("=========================================");
  console.log("🚨 VULNERABLE VAULT DEPLOYED!");
  console.log("=========================================");
  console.log("Contract Address:", contractAddress);
  console.log("WARNING: Do not send real Mainnet funds to this address!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});