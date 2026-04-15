const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying SECURE Vault to Sepolia...");
  
  const SecureVault = await ethers.getContractFactory("SecureVault");
  const vault = await SecureVault.deploy();
  await vault.waitForDeployment();
  
  const contractAddress = await vault.getAddress();
  
  console.log("=========================================");
  console.log("🛡️ SECURE VAULT DEPLOYED!");
  console.log("=========================================");
  console.log("Contract Address:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});