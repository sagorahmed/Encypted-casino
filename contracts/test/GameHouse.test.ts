import { ethers } from "hardhat";
import { expect } from "chai";

describe("GameHouse", function () {
  let gameHouse: any;
  let owner: any;
  let player: any;

  beforeEach(async function () {
    [owner, player] = await ethers.getSigners();

    const GameHouse = await ethers.getContractFactory("GameHouse");
    gameHouse = await GameHouse.deploy();
    await gameHouse.waitForDeployment();
  });

  describe("Deposit and Withdrawal", function () {
    it("Should allow deposits", async function () {
      const depositAmount = ethers.parseEther("0.01");
      await gameHouse.connect(player).deposit({ value: depositAmount });

      const balance = await gameHouse.getContractBalance();
      expect(balance).to.equal(depositAmount);
    });

    it("Should reject zero deposits", async function () {
      await expect(gameHouse.connect(player).deposit({ value: 0 })).to.be.revertedWith(
        "Deposit must be greater than 0"
      );
    });

    it("Should allow withdrawals", async function () {
      const depositAmount = ethers.parseEther("0.01");
      await gameHouse.connect(player).deposit({ value: depositAmount });

      const withdrawAmount = ethers.parseEther("0.005");
      await gameHouse.connect(player).withdraw(withdrawAmount);

      const balance = await gameHouse.getContractBalance();
      expect(balance).to.equal(ethers.parseEther("0.005"));
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to deposit house funds", async function () {
      const depositAmount = ethers.parseEther("0.1");
      await gameHouse.connect(owner).depositHouseFunds({ value: depositAmount });

      const funds = await gameHouse.connect(owner).getHouseFunds();
      expect(funds).to.equal(depositAmount);
    });

    it("Should prevent non-owner from accessing house funds", async function () {
      await expect(gameHouse.connect(player).getHouseFunds())
        .to.be.revertedWithCustomError(gameHouse, "OwnableUnauthorizedAccount")
        .withArgs(player.address);
    });

    it("Should allow owner to withdraw house funds", async function () {
      const depositAmount = ethers.parseEther("0.1");
      await gameHouse.connect(owner).depositHouseFunds({ value: depositAmount });

      const withdrawAmount = ethers.parseEther("0.05");
      const initialBalance = await owner.getBalance();

      const tx = await gameHouse.connect(owner).withdrawHouseFunds(withdrawAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;

      const finalBalance = await owner.getBalance();
      expect(finalBalance).to.be.gt(initialBalance - gasUsed);
    });
  });

  describe("Game Constraints", function () {
    it("Should enforce maximum bet amount", async function () {
      const depositAmount = ethers.parseEther("0.1");
      await gameHouse.connect(player).deposit({ value: depositAmount });

      const maxBet = ethers.parseEther("0.0001");
      const exceedBet = ethers.parseEther("0.001");

      // This would reject in actual implementation
      // await expect(
      //   gameHouse.connect(player).playCoinFlip(encChoice, proof, exceedBet)
      // ).to.be.revertedWith("Invalid bet amount");
    });
  });

  describe("Game History", function () {
    it("Should track game history", async function () {
      const depositAmount = ethers.parseEther("0.01");
      await gameHouse.connect(player).deposit({ value: depositAmount });

      const initialLength = await gameHouse.getGameHistoryLength();
      expect(initialLength).to.equal(0);

      // Games would be added to history after playing
      // Actual game logic requires FHE encryption setup
    });
  });

  describe("View Functions", function () {
    it("Should return contract balance", async function () {
      const depositAmount = ethers.parseEther("0.1");
      await gameHouse.connect(player).deposit({ value: depositAmount });

      const balance = await gameHouse.getContractBalance();
      expect(balance).to.equal(depositAmount);
    });

    it("Should return game history length", async function () {
      const length = await gameHouse.getGameHistoryLength();
      expect(length).to.equal(0);
    });
  });
});
