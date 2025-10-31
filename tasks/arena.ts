import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

const DEFAULT_PLAYER_MESSAGE = "Defaults to the first configured signer";

task("arena:address", "Prints the ArenaGame address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const arenaGame = await deployments.get("ArenaGame");

  console.log(`ArenaGame address is ${arenaGame.address}`);
});

task("arena:register", "Registers the connected signer as a player")
  .addOptionalParam("address", "Optionally specify the ArenaGame contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const arenaDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("ArenaGame");

    const [signer] = await ethers.getSigners();
    const arenaContract = await ethers.getContractAt("ArenaGame", arenaDeployment.address);

    const tx = await arenaContract.connect(signer).registerPlayer();
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx status=${receipt?.status}`);
  });

task("arena:balance", "Decrypts the balance of a player")
  .addOptionalParam("address", "Optionally specify the ArenaGame contract address")
  .addOptionalParam("player", "Player address. " + DEFAULT_PLAYER_MESSAGE)
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const arenaDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("ArenaGame");
    console.log(`ArenaGame: ${arenaDeployment.address}`);

    const signers = await ethers.getSigners();
    const playerAddress = taskArguments.player ?? signers[0].address;

    const arenaContract = await ethers.getContractAt("ArenaGame", arenaDeployment.address);
    const encryptedBalance = await arenaContract.getPlayerBalance(playerAddress);

    if (encryptedBalance === ethers.ZeroHash) {
      console.log(`Encrypted balance: ${encryptedBalance}`);
      console.log("Clear balance   : 0");
      return;
    }

    const clearBalance = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedBalance,
      arenaDeployment.address,
      signers[0],
    );

    console.log(`Encrypted balance: ${encryptedBalance}`);
    console.log(`Clear balance   : ${clearBalance}`);
  });

task("arena:play", "Encrypts a guess and plays a game")
  .addOptionalParam("address", "Optionally specify the ArenaGame contract address")
  .addParam("value", "Guess value between 0 and 99")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const value = parseInt(taskArguments.value, 10);
    if (!Number.isInteger(value)) {
      throw new Error("Argument --value is not an integer");
    }
    if (value < 0 || value >= 100) {
      throw new Error("Argument --value must be between 0 and 99");
    }

    await fhevm.initializeCLIApi();

    const arenaDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("ArenaGame");
    console.log(`ArenaGame: ${arenaDeployment.address}`);

    const signers = await ethers.getSigners();
    const arenaContract = await ethers.getContractAt("ArenaGame", arenaDeployment.address);

    const encryptedInput = await fhevm
      .createEncryptedInput(arenaDeployment.address, signers[0].address)
      .add32(value)
      .encrypt();

    const tx = await arenaContract
      .connect(signers[0])
      .playGame(encryptedInput.handles[0], encryptedInput.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx status=${receipt?.status}`);
  });

task("arena:last-game", "Decrypts the latest game outcome for a player")
  .addOptionalParam("address", "Optionally specify the ArenaGame contract address")
  .addOptionalParam("player", "Player address. " + DEFAULT_PLAYER_MESSAGE)
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const arenaDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("ArenaGame");
    console.log(`ArenaGame: ${arenaDeployment.address}`);

    const signers = await ethers.getSigners();
    const playerAddress = taskArguments.player ?? signers[0].address;

    const arenaContract = await ethers.getContractAt("ArenaGame", arenaDeployment.address);
    const [playerNumber, houseNumber, playerWon, exists] = await arenaContract.getLastGame(playerAddress);

    if (!exists) {
      console.log("No games played yet.");
      return;
    }

    const decryptedPlayerNumber = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      playerNumber,
      arenaDeployment.address,
      signers[0],
    );

    const decryptedHouseNumber = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      houseNumber,
      arenaDeployment.address,
      signers[0],
    );

    const decryptedWinFlag = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      playerWon,
      arenaDeployment.address,
      signers[0],
    );

    console.log(`Player guess : ${decryptedPlayerNumber}`);
    console.log(`House number : ${decryptedHouseNumber}`);
    console.log(`Player won   : ${decryptedWinFlag === 1}`);
  });
