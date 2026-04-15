// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title DeFiVaultV1
 * @author Your Name — Ngoma College
 * @notice Task 9: Blockchain Maintenance & Performance Optimization
 * @dev UUPS Upgradeable DeFi Vault — Version 1
 *      Uses custom ReentrancyGuard (built-in)
 */
contract DeFiVaultV1 is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // ═══════════════════════════════════════
    // CUSTOM REENTRANCY GUARD
    // ═══════════════════════════════════════

    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // ═══════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════

    mapping(address => uint256) public balances;
    uint256 public totalDeposits;
    uint256 public totalUsers;
    mapping(address => bool) public isUser;
    mapping(address => string) public userDocuments;

    // ═══════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════

    event Deposited(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    event Withdrawn(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    event DocumentStored(
        address indexed user,
        string cid,
        uint256 timestamp
    );

    // ═══════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════

    error ZeroAmount();
    error InsufficientBalance(
        address user,
        uint256 requested,
        uint256 available
    );
    error EmptyCID();
    error TransferFailed();

    // ═══════════════════════════════════════
    // INITIALIZER
    // ═══════════════════════════════════════

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address owner) public initializer {
    __Ownable_init(owner);
    // removed __UUPSUpgradeable_init() — not needed in v5
    _status = _NOT_ENTERED;
}
    // ═══════════════════════════════════════
    // MAIN FUNCTIONS
    // ═══════════════════════════════════════

    function deposit() external payable nonReentrant {
        // CHECKS
        if(msg.value == 0) revert ZeroAmount();

        // EFFECTS
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;

        if(!isUser[msg.sender]) {
            isUser[msg.sender] = true;
            totalUsers++;
        }

        // INTERACTIONS
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }

    function withdraw(uint256 amount) external nonReentrant {
        // CHECKS
        if(amount == 0) revert ZeroAmount();
        if(balances[msg.sender] < amount)
            revert InsufficientBalance(
                msg.sender,
                amount,
                balances[msg.sender]
            );

        // EFFECTS — update BEFORE sending ETH
        balances[msg.sender] -= amount;
        totalDeposits -= amount;

        // INTERACTIONS — send ETH last
        (bool success,) = msg.sender.call{value: amount}("");
        if(!success) revert TransferFailed();

        emit Withdrawn(msg.sender, amount, block.timestamp);
    }

    function storeDocument(string memory ipfsCid) external {
        if(bytes(ipfsCid).length == 0) revert EmptyCID();
        userDocuments[msg.sender] = ipfsCid;
        emit DocumentStored(msg.sender, ipfsCid, block.timestamp);
    }

    // ═══════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════

    function getBalance() external view returns(uint256) {
        return balances[msg.sender];
    }

    function getBalanceOf(
        address user
    ) external view returns(uint256) {
        return balances[user];
    }

    function getVaultBalance() external view returns(uint256) {
        return address(this).balance;
    }

    function version() external pure returns(string memory) {
        return "V1";
    }

    // ═══════════════════════════════════════
    // PROXY UPGRADE
    // ═══════════════════════════════════════

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}