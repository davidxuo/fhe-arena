import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { ethers, fhevm } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ArenaGame, ArenaGame__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("ArenaGame")) as ArenaGame__factory;
  const arenaGameContract = (await factory.deploy()) as ArenaGame;
  const arenaGameAddress = await arenaGameContract.getAddress();

  return { arenaGameContract, arenaGameAddress };
}

describe("ArenaGame", function () {
  let signers: Signers;
  let arenaGameContract: ArenaGame;
  let arenaGameAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This hardhat test suite cannot run on Sepolia Testnet");
      this.skip();
    }

    ({ arenaGameContract, arenaGameAddress } = await deployFixture());
  });

  async function decryptValue(ciphertext: string, signer: HardhatEthersSigner) {
    const value = await fhevm.userDecryptEuint(FhevmType.euint32, ciphertext, arenaGameAddress, signer);
    return Number(value);
  }

  it("registers a player with 100 encrypted points", async function () {
    await arenaGameContract.connect(signers.alice).registerPlayer();

    const encryptedBalance = await arenaGameContract.getPlayerBalance(signers.alice.address);
    expect(encryptedBalance).to.not.eq(ethers.ZeroHash);

    const clearBalance = await decryptValue(encryptedBalance, signers.alice);
    expect(clearBalance).to.eq(100);
  });

  it("prevents a player from registering twice", async function () {
    await arenaGameContract.connect(signers.alice).registerPlayer();
    await expect(arenaGameContract.connect(signers.alice).registerPlayer()).to.be.revertedWith(
      "Player already registered",
    );
  });

  it("rejects gameplay for unregistered players", async function () {
    const encryptedInput = await fhevm
      .createEncryptedInput(arenaGameAddress, signers.alice.address)
      .add32(10)
      .encrypt();

    await expect(
      arenaGameContract.connect(signers.alice).playGame(encryptedInput.handles[0], encryptedInput.inputProof),
    ).to.be.revertedWith("Player not registered");
  });

  it("plays a game, updates the balance, and stores the result", async function () {
    await arenaGameContract.connect(signers.alice).registerPlayer();

    const encryptedInput = await fhevm
      .createEncryptedInput(arenaGameAddress, signers.alice.address)
      .add32(99)
      .encrypt();

    const tx = await arenaGameContract
      .connect(signers.alice)
      .playGame(encryptedInput.handles[0], encryptedInput.inputProof);
    await tx.wait();

    const [playerNumber, houseNumber, playerWon, exists] = await arenaGameContract.getLastGame(signers.alice.address);
    expect(exists).to.be.true;

    const decryptedGuess = await decryptValue(playerNumber, signers.alice);
    const decryptedHouse = await decryptValue(houseNumber, signers.alice);
    const winFlag = await decryptValue(playerWon, signers.alice);

    expect(decryptedGuess).to.eq(99);
    expect(winFlag === 0 || winFlag === 1).to.be.true;

    const encryptedBalance = await arenaGameContract.getPlayerBalance(signers.alice.address);
    const clearBalance = await decryptValue(encryptedBalance, signers.alice);

    const expectedBalance = winFlag === 1 ? 110 : 90;
    expect(clearBalance).to.eq(expectedBalance);

    const playedGames = await arenaGameContract.gamesPlayed(signers.alice.address);
    expect(playedGames).to.eq(1);
  });

  it("handles multiple games and tracks counters", async function () {
    await arenaGameContract.connect(signers.alice).registerPlayer();

    // First game with low guess
    const firstInput = await fhevm
      .createEncryptedInput(arenaGameAddress, signers.alice.address)
      .add32(1)
      .encrypt();
    await arenaGameContract
      .connect(signers.alice)
      .playGame(firstInput.handles[0], firstInput.inputProof);

    const afterFirstBalance = await arenaGameContract.getPlayerBalance(signers.alice.address);
    const clearAfterFirst = await decryptValue(afterFirstBalance, signers.alice);
    expect(clearAfterFirst === 90 || clearAfterFirst === 110).to.be.true;

    // Second game with high guess
    const secondInput = await fhevm
      .createEncryptedInput(arenaGameAddress, signers.alice.address)
      .add32(99)
      .encrypt();
    await arenaGameContract
      .connect(signers.alice)
      .playGame(secondInput.handles[0], secondInput.inputProof);

    const totalGames = await arenaGameContract.gamesPlayed(signers.alice.address);
    expect(totalGames).to.eq(2);
  });
});
