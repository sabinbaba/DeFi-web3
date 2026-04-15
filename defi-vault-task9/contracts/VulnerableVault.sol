// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

/**
 * @title VulnerableVault
 * @notice INTENTIONALLY BUGGY CONTRACT — For Task 9 Part 2
 * @dev Contains TWO vulnerabilities:
 *      BUG-001: Reentrancy in withdraw()
 *      BUG-002: Integer Overflow in batchDeposit()
 *
 * DO NOT USE IN PRODUCTION!
 */
contract VulnerableVault {

    mapping(address => uint256) public balances;
    uint256 public totalDeposits;

    event Deposited(address user, uint256 amount);
    event Withdrawn(address user, uint256 amount);

    // ════════════════════════════════════
    // BUG-001: REENTRANCY VULNERABILITY
    // ════════════════════════════════════

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev VULNERABLE withdraw function
     * BUG: Sends ETH BEFORE updating balance
     * ATTACK: Attacker re-enters before balance update
     */
    function withdraw() external {
        uint256 amount = balances[msg.sender];

        // CHECKS ✅
        require(amount > 0, "Nothing to withdraw");

        // INTERACTIONS ← BUG! Should be last!
        // This sends ETH and triggers attacker's receive()
        // Attacker calls withdraw() again before balance updates
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        // EFFECTS ← TOO LATE! Attacker already re-entered!
        balances[msg.sender] = 0;
        totalDeposits -= amount;

        emit Withdrawn(msg.sender, amount);
    }

    // ════════════════════════════════════
    // BUG-002: INTEGER OVERFLOW
    // ════════════════════════════════════

    /**
     * @dev VULNERABLE batch deposit
     * BUG: recipients.length * amount can OVERFLOW
     * In Solidity 0.7: no automatic overflow protection!
     */
    function batchDeposit(
        address[] memory recipients,
        uint256 amount
    ) external payable {
        // BUG: This multiplication can overflow!
        // If recipients.length = 2 and amount = 2^255
        // 2 × 2^255 = 2^256 = overflows to 0
        // require(msg.value >= 0) always passes!
        uint256 total = recipients.length * amount;

        require(msg.value >= total, "Insufficient ETH sent");

        for(uint256 i = 0; i < recipients.length; i++) {
            balances[recipients[i]] += amount;
        }

        totalDeposits += total;
    }

    /**
     * @dev VULNERABLE balance check
     * BUG: uint can never be negative
     * So (balance - amount >= 0) is ALWAYS true!
     * Underflow wraps to huge number
     */
    function unsafeWithdraw(uint256 amount) external {
        // BUG: This check is USELESS for uint!
        // If balance = 0 and amount = 1:
        // 0 - 1 = underflow = huge number
        // huge number >= 0 = always TRUE!
        require(
            balances[msg.sender] - amount >= 0,
            "Insufficient balance"
        );

        balances[msg.sender] -= amount; // underflows!

        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    // Allow contract to receive ETH
    receive() external payable {}
}