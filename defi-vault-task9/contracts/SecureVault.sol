// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SecureVault
 * @notice FIXED version of VulnerableVault with IPFS Integration
 * @dev FIX-001: CEI + ReentrancyGuard (reentrancy)
 * FIX-002: Solidity 0.8+ + correct checks (overflow)
 * FEAT-001: Decentralized storage for legal docs (IPFS)
 */
contract SecureVault is ReentrancyGuard, Ownable {

    mapping(address => uint256) public balances;
    uint256 public totalDeposits;

    // FEAT-001: Mapping to store IPFS CIDs for user documents
    mapping(address => string) public userLegalDocs;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event LegalDocUpdated(address indexed user, string cid); // For Monitoring

    error ZeroAmount();
    error InsufficientBalance();
    error TransferFailed();
    error InvalidRecipients();

    constructor() Ownable(msg.sender) {}

    // ════════════════════════════════════
    // IPFS INTEGRATION
    // ════════════════════════════════════

    /**
     * @notice Stores the CID of a legal document pinned on IPFS
     * @param _cid The content identifier from Pinata (e.g., QmTYbD...)
     */
    function setLegalDoc(string memory _cid) external {
        if(bytes(_cid).length == 0) revert ZeroAmount();
        userLegalDocs[msg.sender] = _cid;
        emit LegalDocUpdated(msg.sender, _cid);
    }

    // ════════════════════════════════════
    // FIX-001: REENTRANCY FIXED
    // ════════════════════════════════════

    function deposit() external payable nonReentrant {
        if(msg.value == 0) revert ZeroAmount();
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];

        // CHECKS
        if(amount == 0) revert ZeroAmount();

        // EFFECTS — zero balance BEFORE transfer
        balances[msg.sender] = 0;
        totalDeposits -= amount;

        // INTERACTIONS — transfer last
        (bool success,) = msg.sender.call{value: amount}("");
        if(!success) revert TransferFailed();

        emit Withdrawn(msg.sender, amount);
    }

    // ════════════════════════════════════
    // FIX-002: OVERFLOW FIXED
    // ════════════════════════════════════

    function batchDeposit(
        address[] memory recipients,
        uint256 amount
    ) external payable nonReentrant {
        if(recipients.length == 0) revert InvalidRecipients();
        if(amount == 0) revert ZeroAmount();

        uint256 total = recipients.length * amount;
        require(msg.value >= total, "Insufficient ETH");

        for(uint256 i = 0; i < recipients.length; i++) {
            balances[recipients[i]] += amount;
        }
        totalDeposits += total;
    }

    function safeWithdraw(uint256 amount) external nonReentrant {
        if(balances[msg.sender] < amount)
            revert InsufficientBalance();

        // EFFECTS
        balances[msg.sender] -= amount;
        totalDeposits -= amount;

        // INTERACTIONS
        (bool success,) = msg.sender.call{value: amount}("");
        if(!success) revert TransferFailed();

        emit Withdrawn(msg.sender, amount);
    }

    receive() external payable {}
}