// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title DeFiVaultV2
 * @notice Task 9: Upgraded version with new features
 */
contract DeFiVaultV2 is
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
    // V1 STATE VARIABLES
    // ⚠️ NEVER change order!
    // ═══════════════════════════════════════

    mapping(address => uint256) public balances;
    uint256 public totalDeposits;
    uint256 public totalUsers;
    mapping(address => bool) public isUser;
    mapping(address => string) public userDocuments;

    // ═══════════════════════════════════════
    // V2 NEW STATE VARIABLES
    // Always add at the END!
    // ═══════════════════════════════════════

    bool public emergencyStop;
    mapping(address => uint256) public depositTimestamps;
    uint256 public maxWithdrawLimit;
    uint256 public interestRate;

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
    event EmergencyStopActivated(
        bool status,
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
    error PlatformPaused();
    error ExceedsWithdrawLimit(
        uint256 requested,
        uint256 limit
    );

    // ═══════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════

    modifier whenNotStopped() {
        if(emergencyStop) revert PlatformPaused();
        _;
    }

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
    maxWithdrawLimit = 0.1 ether;
    interestRate = 500;
}

    // ═══════════════════════════════════════
    // MAIN FUNCTIONS
    // ═══════════════════════════════════════

    function deposit() external payable nonReentrant whenNotStopped {
        if(msg.value == 0) revert ZeroAmount();

        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;

        if(!isUser[msg.sender]) {
            isUser[msg.sender] = true;
            totalUsers++;
            depositTimestamps[msg.sender] = block.timestamp;
        }

        emit Deposited(msg.sender, msg.value, block.timestamp);
    }

    function withdraw(
        uint256 amount
    ) external nonReentrant whenNotStopped {
        if(amount == 0) revert ZeroAmount();
        if(amount > maxWithdrawLimit)
            revert ExceedsWithdrawLimit(amount, maxWithdrawLimit);
        if(balances[msg.sender] < amount)
            revert InsufficientBalance(
                msg.sender,
                amount,
                balances[msg.sender]
            );

        balances[msg.sender] -= amount;
        totalDeposits -= amount;

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
    // NEW V2 FUNCTIONS
    // ═══════════════════════════════════════

    function calculateInterest(
        address user
    ) external view returns(uint256) {
        if(depositTimestamps[user] == 0) return 0;
        uint256 principal = balances[user];
        uint256 timeElapsed = block.timestamp
                              - depositTimestamps[user];
        return (principal * interestRate * timeElapsed)
               / (365 days * 10000);
    }

    function toggleEmergencyStop() external onlyOwner {
        emergencyStop = !emergencyStop;
        emit EmergencyStopActivated(
            emergencyStop,
            block.timestamp
        );
    }

    function setMaxWithdrawLimit(
        uint256 newLimit
    ) external onlyOwner {
        maxWithdrawLimit = newLimit;
    }

    function setInterestRate(
        uint256 newRate
    ) external onlyOwner {
        interestRate = newRate;
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
        return "V2";
    }

    // ═══════════════════════════════════════
    // PROXY UPGRADE
    // ═══════════════════════════════════════

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}