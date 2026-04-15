const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

// ══════════════════════════════════════
// TEST SUITE 1: DeFiVaultV1
// ══════════════════════════════════════
describe("DeFiVaultV1", function () {

    let vault;
    let owner, user1, user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const DeFiVaultV1 = await ethers.getContractFactory("DeFiVaultV1");

        vault = await upgrades.deployProxy(
            DeFiVaultV1,
            [owner.address],
            { kind: "uups" }
        );

        await vault.waitForDeployment();
    });

    // ── Deployment Tests ──────────────
    describe("Deployment", function () {

        it("Should deploy with correct owner", async function () {
            expect(await vault.owner()).to.equal(owner.address);
        });

        it("Should start with zero deposits", async function () {
            expect(await vault.totalDeposits()).to.equal(0);
        });

        it("Should return version V1", async function () {
            expect(await vault.version()).to.equal("V1");
        });

    });

    // ── Deposit Tests ─────────────────
    describe("Deposit", function () {

        it("Should accept ETH deposit", async function () {
            const amount = ethers.parseEther("1.0");

            await vault.connect(user1).deposit({ value: amount });

            expect(
                await vault.balances(user1.address)
            ).to.equal(amount);
        });

        it("Should update totalDeposits", async function () {
            const amount = ethers.parseEther("1.0");
            await vault.connect(user1).deposit({ value: amount });

            expect(await vault.totalDeposits()).to.equal(amount);
        });

        it("Should count new users", async function () {
            await vault.connect(user1).deposit({
                value: ethers.parseEther("1.0")
            });
            await vault.connect(user2).deposit({
                value: ethers.parseEther("0.5")
            });

            expect(await vault.totalUsers()).to.equal(2);
        });

        it("Should REJECT zero deposit", async function () {
            await expect(
                vault.connect(user1).deposit({ value: 0 })
            ).to.be.reverted;
        });

        it("Should emit Deposited event", async function () {
            const amount = ethers.parseEther("1.0");

            await expect(
                vault.connect(user1).deposit({ value: amount })
            ).to.emit(vault, "Deposited");
        });

    });

    // ── Withdraw Tests ────────────────
    describe("Withdraw", function () {

        beforeEach(async function () {
            await vault.connect(user1).deposit({
                value: ethers.parseEther("2.0")
            });
        });

        it("Should allow withdrawal", async function () {
            const withdrawAmount = ethers.parseEther("1.0");

            await vault.connect(user1).withdraw(withdrawAmount);

            expect(
                await vault.balances(user1.address)
            ).to.equal(ethers.parseEther("1.0"));
        });

        it("Should REJECT more than balance", async function () {
            await expect(
                vault.connect(user1).withdraw(
                    ethers.parseEther("5.0")
                )
            ).to.be.reverted;
        });

        it("Should REJECT zero withdrawal", async function () {
            await expect(
                vault.connect(user1).withdraw(0)
            ).to.be.reverted;
        });

        it("Should update balance after withdrawal", async function () {
            const withdrawAmount = ethers.parseEther("1.0");

            await vault.connect(user1).withdraw(withdrawAmount);

            expect(
                await vault.balances(user1.address)
            ).to.equal(ethers.parseEther("1.0"));
        });

        it("Should emit Withdrawn event", async function () {
            await expect(
                vault.connect(user1).withdraw(
                    ethers.parseEther("1.0")
                )
            ).to.emit(vault, "Withdrawn");
        });

    });

    // ── IPFS Document Tests ───────────
    describe("IPFS Document Storage", function () {

        it("Should store document CID", async function () {
            const testCID = "QmYwAPJzv5CZsnA625s3Xf2nemtYgEiJe6p8GecJFfkDmJ";

            await vault.connect(user1).storeDocument(testCID);

            expect(
                await vault.userDocuments(user1.address)
            ).to.equal(testCID);
        });

        it("Should REJECT empty CID", async function () {
            await expect(
                vault.connect(user1).storeDocument("")
            ).to.be.reverted;
        });

        it("Should emit DocumentStored event", async function () {
            await expect(
                vault.connect(user1).storeDocument("QmTestCID123")
            ).to.emit(vault, "DocumentStored");
        });

    });

});

// ══════════════════════════════════════
// TEST SUITE 2: Proxy Upgrade V1 → V2
// ══════════════════════════════════════
describe("Proxy Upgrade V1 → V2", function () {

    let vault;
    let owner, user1;

    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();

        const DeFiVaultV1 = await ethers.getContractFactory("DeFiVaultV1");

        vault = await upgrades.deployProxy(
            DeFiVaultV1,
            [owner.address],
            { kind: "uups" }
        );

        await vault.waitForDeployment();
    });

    it("Should preserve data after upgrade", async function () {
        // Deposit in V1
        const amount = ethers.parseEther("1.0");
        await vault.connect(user1).deposit({ value: amount });

        // Upgrade to V2
        const DeFiVaultV2 = await ethers.getContractFactory("DeFiVaultV2");
        const upgradedVault = await upgrades.upgradeProxy(
            await vault.getAddress(),
            DeFiVaultV2
        );

        // Balance must be preserved!
        expect(
            await upgradedVault.balances(user1.address)
        ).to.equal(amount);
    });

    it("Should show V2 after upgrade", async function () {
        const DeFiVaultV2 = await ethers.getContractFactory("DeFiVaultV2");

        const upgradedVault = await upgrades.upgradeProxy(
            await vault.getAddress(),
            DeFiVaultV2
        );

        expect(await upgradedVault.version()).to.equal("V2");
    });

    it("Should only allow owner to upgrade", async function () {
        const DeFiVaultV2 = await ethers.getContractFactory(
            "DeFiVaultV2",
            user1 // non-owner tries to upgrade
        );

        await expect(
            upgrades.upgradeProxy(
                await vault.getAddress(),
                DeFiVaultV2
            )
        ).to.be.reverted;
    });

});

// ══════════════════════════════════════
// TEST SUITE 3: SecureVault Security
// ══════════════════════════════════════
describe("SecureVault — Security Tests", function () {

    let secureVault;
    let owner, user1, attacker;

    beforeEach(async function () {
        [owner, user1, attacker] = await ethers.getSigners();

        const SecureVault = await ethers.getContractFactory("SecureVault");
        secureVault = await SecureVault.deploy();
        await secureVault.waitForDeployment();
    });

    it("Should allow normal deposit and withdraw", async function () {
        // Deposit
        await secureVault.connect(user1).deposit({
            value: ethers.parseEther("1.0")
        });

        // Withdraw
        await secureVault.connect(user1).withdraw();

        // Balance should be zero
        expect(
            await secureVault.balances(user1.address)
        ).to.equal(0);
    });

    it("Should BLOCK overflow in batchDeposit", async function () {
        const hugeAmount = ethers.MaxUint256;

        await expect(
            secureVault.batchDeposit(
                [user1.address, attacker.address],
                hugeAmount,
                { value: ethers.parseEther("1.0") }
            )
        ).to.be.reverted;
    });

    it("Should BLOCK underflow in safeWithdraw", async function () {
        await expect(
            secureVault.connect(attacker).safeWithdraw(
                ethers.parseEther("1.0")
            )
        ).to.be.reverted;
    });

});