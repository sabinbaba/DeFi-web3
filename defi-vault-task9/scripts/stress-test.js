const { ethers } = require("hardhat");

async function main() {
  // Your live Sepolia Proxy Address
  const PROXY_ADDRESS = "0x62e2F840B0d16823f3071c019333f7255259BD86";
  
  // We use DeFiVaultV2 since you already upgraded to it!
  const DeFiVault = await ethers.getContractAt("DeFiVaultV2", PROXY_ADDRESS);

  console.log("Starting Stress Test on:", PROXY_ADDRESS);
  
  // Sending 5 transactions back-to-back
  const NUM_TXS = 50;
  const depositAmount = ethers.parseEther("0.0001");

  console.log(`Sending ${NUM_TXS} consecutive transactions to calculate TPS and Latency...\n`);

  const startTime = Date.now();
  let totalLatency = 0;

  for (let i = 0; i < NUM_TXS; i++) {
    const txStart = Date.now();
    console.log(`[Tx ${i+1}/${NUM_TXS}] Submitting deposit...`);

    // Send transaction
    const tx = await DeFiVault.deposit({ value: depositAmount });

    // Wait for the transaction to be mined/confirmed
    await tx.wait();

    const txEnd = Date.now();
    const latency = txEnd - txStart;
    totalLatency += latency;

    console.log(`✅ [Tx ${i+1}] Confirmed! Latency: ${(latency / 1000).toFixed(2)} seconds\n`);
  }

  const endTime = Date.now();
  const totalTimeSeconds = (endTime - startTime) / 1000;
  
  // Calculate final metrics
  const tps = NUM_TXS / totalTimeSeconds;
  const avgLatency = (totalLatency / NUM_TXS) / 1000;

  console.log("=========================================");
  console.log("📊 STRESS TEST RESULTS");
  console.log("=========================================");
  console.log(`Total Time Elapsed: ${totalTimeSeconds.toFixed(2)} seconds`);
  console.log(`Total Transactions: ${NUM_TXS}`);
  console.log(`Average Latency (Delay): ${avgLatency.toFixed(2)} seconds/tx`);
  console.log(`Network TPS (Throughput): ${tps.toFixed(3)} tx/sec`);
  console.log("=========================================");
  console.log("📸 TAKE A SCREENSHOT OF THIS FOR YOUR PDF!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});