require('dotenv').config();
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');

// Initialize Pinata with your JWT from .env
const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });

async function uploadToIPFS() {
    try {
        console.log("🔍 Checking connection to Pinata...");
        const auth = await pinata.testAuthentication();
        console.log("✅ Authenticated:", auth.message);

        // --- CONFIGURATION ---
        // Change 'README.md' to whatever file you want to upload
        //const fileName = 'legal-disclaimer.txt'; 
        const fileName = 'test.txt'; 
        const filePath = path.join(__dirname, '..', fileName);
        // ---------------------

        if (!fs.existsSync(filePath)) {
            console.error(`❌ Error: File not found at ${filePath}`);
            return;
        }

        const readableStreamForFile = fs.createReadStream(filePath);
        const options = {
            pinataMetadata: {
                name: `NIT-Project-File-${Date.now()}`,
                keyvalues: {
                    project: 'DeFiVault-Task9',
                    institution: 'NIT'
                }
            },
            pinataOptions: {
                cidVersion: 0
            }
        };

        console.log(`📤 Uploading ${fileName} to IPFS...`);
        const result = await pinata.pinFileToIPFS(readableStreamForFile, options);

        console.log("\n=========================================");
        console.log("🚀 SUCCESS: FILE IS DECENTRALIZED!");
        console.log("=========================================");
        console.log("CID (Hash): ", result.IpfsHash);
        console.log("Size (Bytes):", result.PinSize);
        console.log("Timestamp:  ", result.Timestamp);
        console.log("=========================================");
        console.log(`🔗 View it here: https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);
        console.log("=========================================\n");

        return result.IpfsHash;

    } catch (error) {
        console.error("❌ Critical Error during upload:");
        console.error(error);
    }
}

uploadToIPFS();