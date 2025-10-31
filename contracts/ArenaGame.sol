// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, ebool, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ArenaGame
 * @notice Arena game where players register, spend points to play, and earn encrypted rewards.
 */
contract ArenaGame is SepoliaConfig {
    struct GameOutcome {
        euint32 playerNumber;
        euint32 houseNumber;
        euint32 playerWon;
        bool exists;
    }

    uint32 private constant REGISTRATION_REWARD = 100;
    uint32 private constant GAME_COST = 10;
    uint32 private constant WIN_REWARD = 20;
    uint32 private constant RANDOM_BOUND = 100;

    mapping(address => euint32) private _balances;
    mapping(address => bool) private _registered;
    mapping(address => GameOutcome) private _latestOutcome;
    mapping(address => uint256) private _nonces;

    event PlayerRegistered(address indexed player);
    event GamePlayed(address indexed player, uint256 indexed gameId);

    /**
     * @notice Registers the sender as a player and funds the starting balance.
     */
    function registerPlayer() external {
        require(!_registered[msg.sender], "Player already registered");

        euint32 initialBalance = FHE.asEuint32(REGISTRATION_REWARD);

        _balances[msg.sender] = initialBalance;
        _registered[msg.sender] = true;
        _latestOutcome[msg.sender].exists = false;

        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        emit PlayerRegistered(msg.sender);
    }

    /**
     * @notice Plays a game using an encrypted guess. Deducts the entry cost and rewards winners.
     * @param encryptedGuess The encrypted number provided by the player.
     * @param inputProof The proof associated with the encrypted guess.
     */
    function playGame(externalEuint32 encryptedGuess, bytes calldata inputProof) external {
        require(_registered[msg.sender], "Player not registered");

        euint32 playerGuess = FHE.fromExternal(encryptedGuess, inputProof);

        euint32 currentBalance = _balances[msg.sender];
        euint32 cost = FHE.asEuint32(GAME_COST);
        euint32 balanceAfterCost = FHE.sub(currentBalance, cost);

        uint32 randomValue = _generateRandom(msg.sender);
        euint32 houseNumber = FHE.asEuint32(randomValue);

        ebool playerWins = FHE.gt(playerGuess, houseNumber);
        euint32 reward = FHE.asEuint32(WIN_REWARD);
        euint32 balanceWithReward = FHE.add(balanceAfterCost, reward);
        euint32 finalBalance = FHE.select(playerWins, balanceWithReward, balanceAfterCost);

        euint32 winAsUint = _toWinFlag(playerWins);

        _balances[msg.sender] = finalBalance;

        GameOutcome storage outcome = _latestOutcome[msg.sender];
        outcome.playerNumber = playerGuess;
        outcome.houseNumber = houseNumber;
        outcome.playerWon = winAsUint;
        outcome.exists = true;

        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        FHE.allowThis(outcome.playerNumber);
        FHE.allow(outcome.playerNumber, msg.sender);

        FHE.allowThis(outcome.houseNumber);
        FHE.allow(outcome.houseNumber, msg.sender);

        FHE.allowThis(outcome.playerWon);
        FHE.allow(outcome.playerWon, msg.sender);

        uint256 nextGameId = ++_nonces[msg.sender];

        emit GamePlayed(msg.sender, nextGameId);
    }

    /**
     * @notice Returns the encrypted balance for a specific player.
     * @param player The address of the player to query.
     */
    function getPlayerBalance(address player) external view returns (euint32) {
        return _balances[player];
    }

    /**
     * @notice Returns the last game data for a player.
     * @param player The address of the player to query.
     */
    function getLastGame(
        address player
    )
        external
        view
        returns (euint32 playerNumber, euint32 houseNumber, euint32 playerWon, bool exists)
    {
        GameOutcome storage outcome = _latestOutcome[player];
        return (outcome.playerNumber, outcome.houseNumber, outcome.playerWon, outcome.exists);
    }

    /**
     * @notice Indicates whether a player has registered.
     * @param player The address to check.
     */
    function isRegistered(address player) external view returns (bool) {
        return _registered[player];
    }

    /**
     * @notice Returns the number of games played by a player.
     * @param player The address to query.
     */
    function gamesPlayed(address player) external view returns (uint256) {
        return _nonces[player];
    }

    function _generateRandom(address player) private view returns (uint32) {
        return uint32(uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, player, _nonces[player])))) %
            RANDOM_BOUND;
    }

    function _toWinFlag(ebool winBool) private returns (euint32) {
        euint32 one = FHE.asEuint32(1);
        euint32 zero = FHE.asEuint32(0);
        return FHE.select(winBool, one, zero);
    }
}
