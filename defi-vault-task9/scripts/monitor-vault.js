const express = require('express');
const { ethers } = require('hardhat');
require('dotenv').config();

const app = express();
const VAULT_ADDRESS = "0x43a4B9049cF78642539b2e6e6a58330b30dB1689"; 

app.get('/metrics', async (req, res) => {
    try {
        const vault = await ethers.getContractAt("SecureVault", VAULT_ADDRESS);
        
        // 1. Fetch Total Value Locked
        const total = await vault.totalDeposits();
        const ethValue = ethers.formatEther(total);

        // 2. Prepare Prometheus Metrics
        let m = `# HELP vault_tvl Total Value Locked in ETH\n`;
        m += `# TYPE vault_tvl gauge\n`;
        m += `vault_tvl ${ethValue}\n\n`;

        // Optional: Monitor if a specific admin/user has a doc set
        // m += `# HELP ipfs_doc_status Binary status of legal doc link\n`;
        // m += `ipfs_doc_status 1\n`; 

        res.set('Content-Type', 'text/plain');
        res.send(m);
        
        // Logging for your terminal so you see it working
        console.log(`Scrape successful: TVL is ${ethValue} ETH`);
        
    } catch (e) { 
        console.error("Scrape failed:", e.message);
        res.status(500).send(e.message); 
    }
});

const PORT = 9991;
app.listen(PORT, () => {
    console.log(`🚀 Bridge active at http://localhost:${PORT}/metrics`);
    console.log(`📡 Monitoring Vault: ${VAULT_ADDRESS}`);
});