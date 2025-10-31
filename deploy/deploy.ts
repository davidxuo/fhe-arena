import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedArenaGame = await deploy("ArenaGame", {
    from: deployer,
    log: true,
  });

  console.log(`ArenaGame contract: `, deployedArenaGame.address);
};
export default func;
func.id = "deploy_arenaGame"; // id required to prevent reexecution
func.tags = ["ArenaGame"];
