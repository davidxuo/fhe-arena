# FHE Arena Game

A blockchain-based number guessing game leveraging **Fully Homomorphic Encryption (FHE)** to keep all gameplay data encrypted on-chain. Players compete against the house with complete privacy - their guesses, balances, and game outcomes remain confidential while still being verifiable on the blockchain.

## Table of Contents

- [Overview](#overview)
- [Key Advantages](#key-advantages)
- [Technologies Used](#technologies-used)
- [Problems Solved](#problems-solved)
- [Architecture](#architecture)
- [Game Mechanics](#game-mechanics)
- [Installation](#installation)
- [Usage](#usage)
  - [Smart Contract Deployment](#smart-contract-deployment)
  - [Frontend Development](#frontend-development)
  - [Hardhat Tasks](#hardhat-tasks)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Smart Contract Details](#smart-contract-details)
- [Frontend Features](#frontend-features)
- [Security Considerations](#security-considerations)
- [Future Roadmap](#future-roadmap)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Overview

FHE Arena Game demonstrates the power of **Fully Homomorphic Encryption (FHE)** in blockchain gaming by creating a provably fair number guessing game where all sensitive data remains encrypted on-chain. Built on Zama's **FHEVM** (Fully Homomorphic Encryption Virtual Machine), this project showcases how confidential gaming can be achieved without compromising transparency or trustlessness.

### What Makes This Special?

Traditional blockchain games face a fundamental tradeoff: either keep data on-chain (losing privacy) or off-chain (losing transparency). FHE Arena Game eliminates this tradeoff by enabling computation on encrypted data, allowing the smart contract to process game logic while keeping player information private.

## Key Advantages

### 1. Complete Privacy
- **Player balances** remain encrypted on-chain - nobody can see how many points you have
- **Game guesses** are encrypted before being sent to the blockchain
- **Game outcomes** are computed on encrypted data, maintaining confidentiality throughout

### 2. Provable Fairness
- All game logic executes on-chain with verifiable smart contracts
- Encrypted data prevents front-running and manipulation
- Deterministic outcomes based on blockchain randomness

### 3. True Decentralization
- No trusted third parties or centralized servers
- All gameplay state stored on blockchain
- Complete transparency of game mechanics via open-source smart contracts

### 4. User Control
- Players own their encrypted data
- Only the player can decrypt their personal information
- Non-custodial design - you control your wallet and data

### 5. Scalable Privacy
- FHE enables privacy-preserving features without complex zero-knowledge circuits
- Computation happens directly on encrypted values
- Simpler development compared to traditional privacy solutions

## Technologies Used

### Smart Contract Layer
- **Solidity ^0.8.27** - Smart contract programming language
- **FHEVM by Zama** - Fully Homomorphic Encryption Virtual Machine enabling encrypted computation
- **Hardhat** - Ethereum development environment for compiling, testing, and deploying contracts
- **@fhevm/solidity** - FHE primitive library for Solidity
- **hardhat-deploy** - Deployment management and scripting
- **TypeChain** - TypeScript bindings for smart contracts
- **Ethers.js v6** - Ethereum wallet and contract interaction library

### Frontend Layer
- **React 19** - Modern UI library with concurrent features
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Next-generation frontend build tool with fast HMR
- **RainbowKit** - Beautiful wallet connection UI with multi-wallet support
- **Wagmi v2** - React hooks for Ethereum interaction
- **TanStack Query** - Powerful data synchronization and caching
- **@zama-fhe/relayer-sdk** - Client-side FHE operations and decryption

### Development Tools
- **Mocha + Chai** - Testing framework with assertion library
- **ESLint + Prettier** - Code quality and formatting
- **Solhint** - Solidity linting
- **Hardhat Gas Reporter** - Gas usage analysis
- **Solidity Coverage** - Test coverage reporting

### Infrastructure
- **Sepolia Testnet** - Ethereum test network for deployment
- **Infura** - Ethereum node infrastructure
- **Etherscan** - Contract verification and exploration

## Problems Solved

### 1. Privacy Leakage in On-Chain Gaming
**Problem**: Traditional blockchain games expose all player data publicly, including balances, strategies, and outcomes.

**Solution**: FHE Arena Game encrypts all sensitive data on-chain. Player balances, guesses, and game results are stored as encrypted values, viewable only by the player.

### 2. Front-Running and MEV Attacks
**Problem**: Public transaction data allows malicious actors to front-run player actions and manipulate game outcomes.

**Solution**: Encrypted inputs prevent front-running since attackers cannot determine the player's guess before the transaction is mined.

### 3. Trusted Third Parties
**Problem**: Many privacy-preserving games rely on centralized servers or trusted randomness providers.

**Solution**: All game logic executes on-chain with blockchain-based randomness. No centralized components or trusted third parties.

### 4. Scalability vs Privacy Tradeoff
**Problem**: Zero-knowledge proof systems often require complex circuits and significant computational overhead.

**Solution**: FHE enables privacy-preserving computation with simpler contract logic, making development more accessible.

### 5. Data Ownership
**Problem**: Players don't truly own their game data when stored in centralized databases.

**Solution**: All data is on-chain and encrypted to the player's wallet. Players maintain full ownership and control.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ RainbowKit   │  │ Wagmi Hooks  │  │ Zama FHE Client │  │
│  │ (Wallet UI)  │  │ (Blockchain) │  │ (Encryption)    │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Web3 RPC
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ethereum Network (Sepolia)                │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            ArenaGame Smart Contract                  │   │
│  │                                                       │   │
│  │  • FHE Operations (euint32, ebool)                  │   │
│  │  • Player Registration (100 points)                 │   │
│  │  • Encrypted Game Logic (-10 cost, +20 reward)     │   │
│  │  • Encrypted Balance Storage                        │   │
│  │  • Encrypted Game History                           │   │
│  │  • On-chain Randomness Generation                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Encrypted State
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   FHEVM (Zama Protocol Layer)                │
│                                                               │
│  • Homomorphic Encryption Operations                         │
│  • Encrypted State Management                                │
│  • Private Key Management                                    │
│  • Decryption Gateway                                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Player Registration**:
   - User connects wallet via RainbowKit
   - Calls `registerPlayer()` on smart contract
   - Contract creates encrypted balance of 100 points
   - Balance stored as `euint32` (encrypted uint32)

2. **Playing a Game**:
   - Player inputs guess (0-99) in frontend
   - Zama client encrypts input locally
   - Encrypted guess sent to blockchain with zero-knowledge proof
   - Smart contract:
     - Validates player registration
     - Deducts 10 points (encrypted subtraction)
     - Generates random house number
     - Compares encrypted guess vs house number
     - Awards 20 points if player wins (encrypted addition)
     - Stores encrypted game outcome

3. **Decryption**:
   - Player requests decryption via frontend
   - Generates temporary keypair for decryption
   - Signs EIP-712 message authorizing decryption
   - Zama relayer service decrypts data using signature
   - Plaintext values displayed only to player

## Game Mechanics

### Registration
- New players call `registerPlayer()` to join
- Receives **100 starting points** (encrypted)
- Can only register once per address

### Playing
- Each game costs **10 points** (entry fee)
- Player guesses a number between **0-99**
- House generates a random number between **0-99**
- **Win condition**: Player's guess > House's number
- **Reward**: +20 points for winning

### Economics
- Registration: **+100 points**
- Game cost: **-10 points**
- Win reward: **+20 points**
- Net profit per win: **+10 points**
- Break-even win rate: **50%** (provably fair due to on-chain randomness)

### Randomness
The smart contract uses a combination of:
- `block.prevrandao` (Ethereum beacon chain randomness)
- `block.timestamp` (block production time)
- Player address (unique per player)
- Game nonce (increments per game)

Combined via `keccak256` hash for unpredictable outcomes.

## Installation

### Prerequisites
- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **Git**: For cloning the repository
- **MetaMask** or compatible Web3 wallet

### Clone Repository

```bash
git clone https://github.com/yourusername/fhe-arena.git
cd fhe-arena
```

### Install Dependencies

#### Backend (Smart Contracts)
```bash
npm install
```

#### Frontend
```bash
cd src
npm install
cd ..
```

### Environment Setup

1. **Create `.env` file** in root directory:
```bash
# Wallet private key (DO NOT COMMIT)
PRIVATE_KEY=your_private_key_here

# Infura API key for Sepolia access
INFURA_API_KEY=your_infura_api_key_here
```

2. **Optional: Set up Hardhat vars** (more secure than .env):
```bash
npx hardhat vars set PRIVATE_KEY
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY
```

### Get Testnet ETH

Visit a Sepolia faucet to get test ETH:
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [QuickNode Faucet](https://faucet.quicknode.com/ethereum/sepolia)

## Usage

### Smart Contract Deployment

#### 1. Compile Contracts
```bash
npm run compile
```

This compiles Solidity contracts and generates TypeScript bindings via TypeChain.

#### 2. Run Tests
```bash
# Local tests with FHEVM mock
npm run test

# Coverage report
npm run coverage
```

#### 3. Deploy to Local Network
```bash
# Terminal 1: Start local FHEVM node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat deploy --network localhost
```

#### 4. Deploy to Sepolia Testnet
```bash
# Deploy contract
npx hardhat deploy --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

#### 5. Update Frontend Configuration

After deployment, update `src/src/config/contracts.ts` with your deployed contract address:

```typescript
export const ARENA_CONTRACT_ADDRESS = '0xYourDeployedContractAddress';
```

### Frontend Development

#### 1. Start Development Server
```bash
cd src
npm run dev
```

Frontend will be available at `http://localhost:5173`

#### 2. Build for Production
```bash
npm run build
```

Outputs to `src/dist/` directory.

#### 3. Preview Production Build
```bash
npm run preview
```

### Hardhat Tasks

Custom tasks for interacting with deployed contracts:

#### Get Contract Address
```bash
npx hardhat arena:address --network sepolia
```

#### Register Player
```bash
npx hardhat arena:register --network sepolia
```

#### Check Balance
```bash
# Your balance
npx hardhat arena:balance --network sepolia

# Another player's balance
npx hardhat arena:balance --player 0xPlayerAddress --network sepolia
```

#### Play Game
```bash
npx hardhat arena:play --value 75 --network sepolia
```

#### View Last Game Result
```bash
npx hardhat arena:last-game --network sepolia
```

## Testing

### Local Testing (Mock FHEVM)

The test suite uses a mocked FHEVM environment for fast local testing:

```bash
npm run test
```

**Test Coverage:**
- Player registration with encrypted balance
- Duplicate registration prevention
- Unregistered player rejection
- Game play with balance updates
- Multiple games with proper counter tracking
- Encrypted outcome storage and retrieval

### Sepolia Testnet Testing

Test against real FHEVM deployment:

```bash
npm run test:sepolia
```

**Note**: Requires deployed contract and Sepolia ETH.

### Test File Examples

`test/ArenaGame.ts` - Local mock tests
`test/ArenaGameSepolia.ts` - Sepolia integration tests

## Project Structure

```
fhe-arena/
├── contracts/
│   └── ArenaGame.sol           # Main game contract with FHE logic
├── deploy/
│   └── deploy.ts               # Deployment script for Hardhat Deploy
├── tasks/
│   ├── accounts.ts             # Account management tasks
│   └── arena.ts                # Game interaction tasks
├── test/
│   ├── ArenaGame.ts            # Local FHEVM mock tests
│   └── ArenaGameSepolia.ts     # Sepolia integration tests
├── src/                        # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ArenaApp.tsx   # Main game UI component
│   │   │   └── Header.tsx      # Navigation header
│   │   ├── config/
│   │   │   ├── wagmi.ts        # Wagmi/RainbowKit configuration
│   │   │   └── contracts.ts    # Contract ABI and address
│   │   ├── hooks/
│   │   │   ├── useEthersSigner.ts     # Wagmi to Ethers adapter
│   │   │   └── useZamaInstance.ts     # FHE client initialization
│   │   ├── styles/             # CSS styling
│   │   ├── App.tsx             # Root application component
│   │   └── main.tsx            # Application entry point
│   ├── public/                 # Static assets
│   ├── index.html              # HTML template
│   ├── vite.config.ts          # Vite configuration
│   └── package.json            # Frontend dependencies
├── hardhat.config.ts           # Hardhat configuration
├── package.json                # Backend dependencies
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## Smart Contract Details

### ArenaGame.sol

**State Variables:**
- `_balances`: Mapping of player addresses to encrypted balances (`euint32`)
- `_registered`: Mapping tracking registered players
- `_latestOutcome`: Stores encrypted game outcomes per player
- `_nonces`: Game counter for each player (used in randomness)

**Key Functions:**

#### `registerPlayer()`
Registers a new player and grants 100 encrypted starting points.

```solidity
function registerPlayer() external
```

**Requirements:**
- Player not already registered

**Effects:**
- Creates encrypted balance of 100 points
- Sets registration flag
- Grants permissions for balance access

#### `playGame(externalEuint32 encryptedGuess, bytes calldata inputProof)`
Executes a game round with an encrypted guess.

```solidity
function playGame(
    externalEuint32 encryptedGuess,
    bytes calldata inputProof
) external
```

**Parameters:**
- `encryptedGuess`: Player's encrypted number (0-99)
- `inputProof`: Zero-knowledge proof of correct encryption

**Requirements:**
- Player must be registered
- Valid encryption proof

**Game Logic:**
1. Decrypt and validate input proof
2. Deduct 10 points from balance (encrypted)
3. Generate random house number
4. Compare player guess vs house (encrypted)
5. Award 20 points if player wins (encrypted)
6. Store encrypted game outcome
7. Grant decryption permissions to player

#### `getPlayerBalance(address player)`
Returns a player's encrypted balance.

```solidity
function getPlayerBalance(address player)
    external view returns (euint32)
```

#### `getLastGame(address player)`
Returns encrypted data from a player's most recent game.

```solidity
function getLastGame(address player)
    external view returns (
        euint32 playerNumber,
        euint32 houseNumber,
        euint32 playerWon,
        bool exists
    )
```

#### `isRegistered(address player)`
Checks if a player has registered.

```solidity
function isRegistered(address player)
    external view returns (bool)
```

#### `gamesPlayed(address player)`
Returns the number of games a player has played.

```solidity
function gamesPlayed(address player)
    external view returns (uint256)
```

## Frontend Features

### Wallet Connection
- Multi-wallet support via RainbowKit (MetaMask, WalletConnect, Coinbase Wallet, etc.)
- Automatic network detection and switching
- Connection persistence across page reloads

### Player Dashboard
- Real-time display of registration status
- Games played counter
- Encrypted balance display with on-demand decryption
- Connection status indicators

### Game Interface
- Number input (0-99) with validation
- Visual feedback for transactions
- Automatic state refresh after actions
- Loading states for async operations

### Encrypted Data Management
- **Client-side encryption**: Guesses encrypted before sending
- **On-demand decryption**: Balance and game results decrypted only when requested
- **Signature-based authorization**: EIP-712 signatures for secure decryption requests
- **Temporary keypairs**: Generated per decryption session for security

### Error Handling
- Network error detection and user-friendly messages
- Transaction failure handling with detailed errors
- Input validation with instant feedback
- Wallet connection error handling

## Security Considerations

### Smart Contract Security
- **Access Control**: Functions properly restricted (external/view/pure)
- **Reentrancy Protection**: No external calls during state changes
- **Integer Overflow**: Solidity 0.8.x built-in overflow protection
- **Input Validation**: Requires valid encryption proofs
- **Permission Management**: Explicit FHE permission grants per operation

### Frontend Security
- **No Private Key Storage**: Wallet integration handles keys securely
- **Secure RPC**: HTTPS connections to Infura
- **Input Sanitization**: Number validation before encryption
- **Signature Verification**: EIP-712 typed signatures for decryption

### FHE Security Model
- **Encrypted State**: All sensitive data encrypted on-chain
- **Computation Privacy**: Operations on encrypted values don't leak information
- **Access Control**: Only authorized addresses can decrypt their data
- **Proof Verification**: Zero-knowledge proofs validate encrypted inputs

### Randomness Security
- **Block Randomness**: Uses `block.prevrandao` from Ethereum beacon chain
- **Additional Entropy**: Combines timestamp, player address, and nonce
- **Collision Resistance**: Keccak256 hash for uniform distribution

**Note**: `block.prevrandao` is secure for gaming applications but may be vulnerable to validator manipulation in high-stakes scenarios. For production with larger economic stakes, consider integrating Chainlink VRF or similar VRF solutions.

## Future Roadmap

### Phase 1: Enhanced Gameplay
- [ ] Multiple game modes (higher/lower, exact match, range betting)
- [ ] Difficulty levels with adjusted payouts
- [ ] Daily challenges and quests
- [ ] Achievement system
- [ ] Leaderboard with encrypted rankings

### Phase 2: Multiplayer Features
- [ ] Player-vs-player betting (encrypted bets)
- [ ] Tournaments with encrypted brackets
- [ ] Team-based competitions
- [ ] Social features (friend list, encrypted messaging)

### Phase 3: Economic Improvements
- [ ] Token integration for rewards
- [ ] NFT prizes for achievements
- [ ] Staking mechanisms
- [ ] Liquidity pools for house funding
- [ ] Referral program

### Phase 4: Advanced Privacy
- [ ] Encrypted leaderboards (rank without revealing scores)
- [ ] Private tournaments (invitation-only, encrypted participant lists)
- [ ] Encrypted chat/messaging between players
- [ ] Privacy-preserving analytics dashboard

### Phase 5: Cross-Chain & Scaling
- [ ] Multi-chain deployment (Polygon, Arbitrum, Optimism)
- [ ] Cross-chain encrypted state bridges
- [ ] Layer 2 integration for lower gas fees
- [ ] Mobile app (iOS/Android)

### Phase 6: Decentralized Governance
- [ ] DAO for game parameter governance
- [ ] Community-voted game modes
- [ ] Transparent treasury management
- [ ] Revenue sharing with token holders

### Phase 7: Developer Tools
- [ ] SDK for building FHE games
- [ ] Template contracts for common game patterns
- [ ] Testing utilities for encrypted state
- [ ] Documentation and tutorials

### Research & Development
- [ ] Gas optimization for FHE operations
- [ ] Advanced cryptographic schemes (threshold encryption, MPC)
- [ ] Performance benchmarking vs traditional approaches
- [ ] Integration with other privacy protocols (zk-SNARKs, TEEs)

## Documentation

### Official Resources
- **FHEVM Documentation**: [https://docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)
- **FHEVM Hardhat Guide**: [https://docs.zama.ai/protocol/solidity-guides/getting-started/setup](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- **Hardhat**: [https://hardhat.org/](https://hardhat.org/)
- **RainbowKit**: [https://www.rainbowkit.com/](https://www.rainbowkit.com/)
- **Wagmi**: [https://wagmi.sh/](https://wagmi.sh/)

### Tutorials
- [FHEVM Quick Start](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)
- [Writing FHE Tests](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [Deploying FHE Contracts](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/deploy)

### Community
- **Zama Discord**: [https://discord.gg/zama](https://discord.gg/zama)
- **Zama GitHub**: [https://github.com/zama-ai/fhevm](https://github.com/zama-ai/fhevm)
- **Twitter**: [@zama_fhe](https://twitter.com/zama_fhe)

## Contributing

We welcome contributions from the community! Here's how you can help:

### Reporting Bugs
1. Check [existing issues](https://github.com/yourusername/fhe-arena/issues) to avoid duplicates
2. Create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (browser, wallet, network)

### Suggesting Features
1. Open a [feature request issue](https://github.com/yourusername/fhe-arena/issues/new)
2. Describe the feature and its benefits
3. Include mockups or examples if applicable

### Submitting Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with clear commit messages
4. Add tests for new functionality
5. Ensure all tests pass (`npm run test`)
6. Run linting (`npm run lint`)
7. Submit a pull request with detailed description

### Development Guidelines
- Follow existing code style and conventions
- Write comprehensive tests for new features
- Update documentation for API changes
- Use meaningful variable and function names
- Comment complex logic thoroughly

## License

This project is licensed under the **BSD-3-Clause-Clear License**. See the [LICENSE](LICENSE) file for details.

### Third-Party Licenses
- FHEVM: BSD-3-Clause-Clear (Zama)
- Hardhat: MIT License
- React: MIT License
- RainbowKit: MIT License

## Support

### Getting Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/fhe-arena/issues)
- **Documentation**: Check this README and official FHEVM docs
- **Community Discord**: Ask questions in Zama's Discord server

### Common Issues

#### "FHEVM mock not initialized"
**Solution**: Ensure you're running local tests with `npm run test`, not on Sepolia without proper setup.

#### "Insufficient funds for gas"
**Solution**: Get Sepolia ETH from a faucet listed in the Installation section.

#### "Contract address not configured"
**Solution**: Update `src/src/config/contracts.ts` with your deployed contract address.

#### "Wallet not connected"
**Solution**: Click "Connect Wallet" button and approve connection in your wallet.

#### "Transaction reverted"
**Solution**: Check that:
- You have enough Sepolia ETH for gas
- You're registered before playing
- Your input is a valid number (0-99)

### Contact
- **Email**: support@fhe-arena.example.com
- **Twitter**: [@fhearena](https://twitter.com/fhearena)
- **Discord**: Join the Zama Discord and mention @fhe-arena

---

**Built with privacy in mind** | **Powered by Zama FHEVM** | **Deployed on Ethereum Sepolia**

*Experience the future of private gaming on the blockchain*
