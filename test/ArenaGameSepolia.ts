import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { ethers, fhevm, deployments } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ArenaGame } from "../types";

type Signers = {
  player: HardhatEthersSigner;
};

describe("ArenaGameSepolia", function () {
  let signers: Signers;
  let arenaGameContract: ArenaGame;
  let arenaGameAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn("This hardhat test suite can only run on Sepolia Testnet");
      this.skip();
    }

    try {
      const arenaDeployment = await deployments.get("ArenaGame");
      arenaGameAddress = arenaDeployment.address;
      arenaGameContract = (await ethers.getContractAt("ArenaGame", arenaDeployment.address)) as ArenaGame;
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { player: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  async function decryptValue(ciphertext: string) {
    const value = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      ciphertext,
      arenaGameAddress,
      signers.player,
    );
    return Number(value);
  }

  it("registers and plays a game on Sepolia", async function () {
    steps = 12;
    this.timeout(6 * 60000);

    try {
      progress("Attempting to register player...");
      const registerTx = await arenaGameContract.connect(signers.player).registerPlayer();
      await registerTx.wait();
    } catch (err) {
      if (!(err instanceof Error && err.message.includes("Player already registered"))) {
        throw err;
      }
      progress("Player already registered, continuing...");
    }

    progress("Encrypting guess '42'...");
    const encryptedGuess = await fhevm
      .createEncryptedInput(arenaGameAddress, signers.player.address)
      .add32(42)
      .encrypt();

    progress("Submitting playGame transaction...");
    const tx = await arenaGameContract
      .connect(signers.player)
      .playGame(encryptedGuess.handles[0], encryptedGuess.inputProof);
    progress(`Sent tx ${tx.hash}, waiting...`);
    await tx.wait();

    progress("Fetching encrypted balance...");
    const encryptedBalance = await arenaGameContract.getPlayerBalance(signers.player.address);
    const decryptedBalance = await decryptValue(encryptedBalance);
    progress(`Balance decrypted: ${decryptedBalance}`);

    progress("Fetching last game data...");
    const [playerNumber, houseNumber, playerWon, exists] = await arenaGameContract.getLastGame(signers.player.address);
    expect(exists).to.eq(true);

    progress("Decrypting player number...");
    const clearPlayerNumber = await decryptValue(playerNumber);
    progress("Decrypting house number...");
    const clearHouseNumber = await decryptValue(houseNumber);
    progress("Decrypting win flag...");
    const clearWinFlag = await decryptValue(playerWon);

    progress(`Guess=${clearPlayerNumber} House=${clearHouseNumber} Won=${clearWinFlag === 1}`);

    expect(clearPlayerNumber).to.eq(42);
    expect(clearWinFlag === 0 || clearWinFlag === 1).to.eq(true);
  });
});
