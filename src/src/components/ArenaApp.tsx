import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { Contract } from 'ethers';

import { Header } from './Header';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { ARENA_CONTRACT_ADDRESS, ARENA_CONTRACT_ABI } from '../config/contracts';
import '../styles/ArenaApp.css';

type LastGameCipher = {
  player: string;
  house: string;
  win: string;
  exists: boolean;
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function isZeroCiphertext(value: string | undefined | null) {
  if (!value) {
    return true;
  }

  const normalised = value.startsWith('0x') ? value.slice(2) : value;
  return normalised.length === 0 || /^0+$/.test(normalised);
}

export function ArenaApp() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { instance, isLoading: zamaLoading, error: zamaError } = useZamaInstance();
  const signerPromise = useEthersSigner();

  const [isRegistered, setIsRegistered] = useState(false);
  const [encryptedBalance, setEncryptedBalance] = useState<string>('');
  const [balanceValue, setBalanceValue] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState('');
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [lastGame, setLastGame] = useState<LastGameCipher | null>(null);
  const [lastGameValues, setLastGameValues] = useState<{ player: number; house: number; win: number } | null>(null);
  const [lastGameError, setLastGameError] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [txMessage, setTxMessage] = useState('');
  const [txError, setTxError] = useState('');
  const [playInput, setPlayInput] = useState('');
  const [playError, setPlayError] = useState('');
  const [decryptingBalance, setDecryptingBalance] = useState(false);
  const [decryptingGame, setDecryptingGame] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const contractAddress = ARENA_CONTRACT_ADDRESS;
  const contractConfigured = contractAddress !== ZERO_ADDRESS;

  const resetState = useCallback(() => {
    setIsRegistered(false);
    setEncryptedBalance('');
    setBalanceValue(null);
    setBalanceError('');
    setGamesPlayed(0);
    setLastGame(null);
    setLastGameValues(null);
    setLastGameError('');
    setGeneralError('');
  }, []);

  const fetchContractState = useCallback(async () => {
    if (!contractConfigured) {
      setGeneralError('Set the deployed ArenaGame address in config/contracts.ts.');
      return;
    }

    if (!isConnected || !address || !publicClient) {
      return;
    }

    try {
      setIsFetching(true);
      setGeneralError('');

      const [registered, balanceCipher, lastGameData, gamesCount] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: ARENA_CONTRACT_ABI,
          functionName: 'isRegistered',
          args: [address],
        }) as Promise<boolean>,
        publicClient.readContract({
          address: contractAddress,
          abi: ARENA_CONTRACT_ABI,
          functionName: 'getPlayerBalance',
          args: [address],
        }) as Promise<string>,
        publicClient.readContract({
          address: contractAddress,
          abi: ARENA_CONTRACT_ABI,
          functionName: 'getLastGame',
          args: [address],
        }) as Promise<[string, string, string, boolean]>,
        publicClient.readContract({
          address: contractAddress,
          abi: ARENA_CONTRACT_ABI,
          functionName: 'gamesPlayed',
          args: [address],
        }) as Promise<bigint>,
      ]);

      setIsRegistered(registered);
      setEncryptedBalance(balanceCipher);
      setBalanceValue(null);
      setBalanceError('');

      const [playerNumber, houseNumber, playerWon, exists] = lastGameData;
      if (exists) {
        setLastGame({ player: playerNumber, house: houseNumber, win: playerWon, exists });
      } else {
        setLastGame(null);
      }
      setLastGameValues(null);
      setLastGameError('');

      setGamesPlayed(Number(gamesCount));
    } catch (error) {
      console.error('Failed to fetch Arena state:', error);
      setGeneralError('Unable to load Arena state. Please retry after checking your connection.');
    } finally {
      setIsFetching(false);
    }
  }, [address, contractAddress, contractConfigured, isConnected, publicClient]);

  useEffect(() => {
    if (!isConnected) {
      resetState();
      return;
    }

    fetchContractState();
  }, [fetchContractState, isConnected, resetState]);

  const ensureSigner = useCallback(async () => {
    if (!signerPromise) {
      throw new Error('Wallet not connected.');
    }

    const signer = await signerPromise;
    if (!signer) {
      throw new Error('Unable to access wallet signer.');
    }

    return signer;
  }, [signerPromise]);

  const decryptCiphertext = useCallback(
    async (ciphertext: string) => {
      if (isZeroCiphertext(ciphertext)) {
        return 0;
      }

      if (!instance) {
        throw new Error('Encryption service unavailable.');
      }

      const signer = await ensureSigner();
      const signerAddress = await signer.getAddress();

      const keypair = instance.generateKeypair();
      const handleContractPairs = [
        {
          handle: ciphertext,
          contractAddress,
        },
      ];
      const startTimestamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const contractAddresses = [contractAddress];

      const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimestamp, durationDays);
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.startsWith('0x') ? signature.slice(2) : signature,
        contractAddresses,
        signerAddress,
        startTimestamp,
        durationDays,
      );

      const value = result[ciphertext];
      if (value === undefined) {
        throw new Error('Failed to decrypt ciphertext.');
      }

      return Number(value);
    },
    [contractAddress, ensureSigner, instance],
  );

  const handleRegister = useCallback(async () => {
    setTxError('');
    setTxMessage('Preparing registration transaction...');

    try {
      if (!contractConfigured) {
        throw new Error('Update ARENA_CONTRACT_ADDRESS before interacting with the contract.');
      }
      if (!address) {
        throw new Error('Connect your wallet to register.');
      }

      const signer = await ensureSigner();
      const contract = new Contract(contractAddress, ARENA_CONTRACT_ABI, signer);

      const tx = await contract.registerPlayer();
      setTxMessage(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      setTxMessage('Registration confirmed.');
      await fetchContractState();
    } catch (error) {
      console.error('Registration failed:', error);
      setTxError(error instanceof Error ? error.message : 'Failed to register player.');
    } finally {
      setTimeout(() => setTxMessage(''), 4000);
    }
  }, [address, contractAddress, contractConfigured, ensureSigner, fetchContractState]);

  const handlePlay = useCallback(async () => {
    setPlayError('');
    setTxError('');
    setTxMessage('Preparing game transaction...');

    try {
      if (!contractConfigured) {
        throw new Error('Update ARENA_CONTRACT_ADDRESS before interacting with the contract.');
      }
      if (!address) {
        throw new Error('Connect your wallet to play.');
      }
      if (!instance) {
        throw new Error('Encryption service unavailable.');
      }

      const guessValue = Number(playInput);
      if (!Number.isInteger(guessValue) || guessValue < 0 || guessValue > 99) {
        throw new Error('Enter a number between 0 and 99.');
      }

      const signer = await ensureSigner();
      const contract = new Contract(contractAddress, ARENA_CONTRACT_ABI, signer);

      const encryptedBuffer = instance.createEncryptedInput(contractAddress, address);
      encryptedBuffer.add32(guessValue);
      const encryptedGuess = await encryptedBuffer.encrypt();

      const tx = await contract.playGame(encryptedGuess.handles[0], encryptedGuess.inputProof);
      setTxMessage(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      setTxMessage('Game finished. Refreshing data...');

      setPlayInput('');
      await fetchContractState();
    } catch (error) {
      console.error('Play failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to play the game.';
      if (message.includes('number')) {
        setPlayError(message);
      } else {
        setTxError(message);
      }
    } finally {
      setTimeout(() => setTxMessage(''), 4000);
    }
  }, [address, contractAddress, contractConfigured, ensureSigner, fetchContractState, instance, playInput]);

  const handleDecryptBalance = useCallback(async () => {
    if (!encryptedBalance) {
      return;
    }

    setBalanceError('');
    setDecryptingBalance(true);

    try {
      const value = await decryptCiphertext(encryptedBalance);
      setBalanceValue(value);
    } catch (error) {
      console.error('Balance decryption failed:', error);
      setBalanceError(error instanceof Error ? error.message : 'Failed to decrypt balance.');
    } finally {
      setDecryptingBalance(false);
    }
  }, [decryptCiphertext, encryptedBalance]);

  const handleDecryptLastGame = useCallback(async () => {
    if (!lastGame) {
      return;
    }

    setLastGameError('');
    setDecryptingGame(true);

    try {
      const [player, house, win] = await Promise.all([
        decryptCiphertext(lastGame.player),
        decryptCiphertext(lastGame.house),
        decryptCiphertext(lastGame.win),
      ]);

      setLastGameValues({ player, house, win });
    } catch (error) {
      console.error('Game decryption failed:', error);
      setLastGameError(error instanceof Error ? error.message : 'Failed to decrypt game outcome.');
    } finally {
      setDecryptingGame(false);
    }
  }, [decryptCiphertext, lastGame]);

  const registeredLabel = useMemo(() => (isRegistered ? 'Registered player' : 'Registration required'), [isRegistered]);

  return (
    <div className="arena-app">
      <Header />
      <main className="arena-main">
        <section className="status-section">
          <div className={`status-badge ${isRegistered ? 'registered' : 'unregistered'}`}>{registeredLabel}</div>
          {zamaLoading && <p className="info-text">Initializing encryption service...</p>}
          {zamaError && <p className="error-text">{zamaError}</p>}
          {generalError && <p className="error-text">{generalError}</p>}
          {txMessage && <p className="info-text">{txMessage}</p>}
          {txError && <p className="error-text">{txError}</p>}
        </section>

        <section className="info-grid">
          <article className="info-card">
            <h2>Player Overview</h2>
            <p className="info-line">Wallet: {address ?? 'Not connected'}</p>
            <p className="info-line">Games played: {gamesPlayed}</p>
            <div className="button-row">
              <button className="primary-button" onClick={handleRegister} disabled={!isConnected || zamaLoading || !contractConfigured}>
                Register
              </button>
              <button className="outline-button" onClick={fetchContractState} disabled={!isConnected || isFetching}>
                Refresh
              </button>
            </div>
          </article>

          <article className="info-card">
            <h2>Encrypted Balance</h2>
            <p className="cipher-text">{encryptedBalance || '0x0'}</p>
            {balanceValue !== null ? (
              <p className="info-line">
                Current balance: <strong>{balanceValue}</strong> points
              </p>
            ) : (
              <p className="info-line">Decrypt your balance to reveal your points.</p>
            )}
            {balanceError && <p className="error-text">{balanceError}</p>}
            <button
              className="secondary-button"
              onClick={handleDecryptBalance}
              disabled={!isConnected || zamaLoading || decryptingBalance || isZeroCiphertext(encryptedBalance)}
            >
              {decryptingBalance ? 'Decrypting...' : 'Decrypt Balance'}
            </button>
          </article>

          <article className="info-card">
            <h2>Last Game</h2>
            {lastGame ? (
              <>
                <p className="cipher-text">Player guess: {lastGame.player}</p>
                <p className="cipher-text">Arena number: {lastGame.house}</p>
                <p className="cipher-text">Win flag: {lastGame.win}</p>
              </>
            ) : (
              <p className="info-line">No games played yet.</p>
            )}

            {lastGameValues && (
              <div className="decrypted-summary">
                <p className="info-line">Your guess: {lastGameValues.player}</p>
                <p className="info-line">Arena number: {lastGameValues.house}</p>
                <p className="info-line">Outcome: {lastGameValues.win === 1 ? 'Victory (+20)' : 'Defeat'}</p>
              </div>
            )}
            {lastGameError && <p className="error-text">{lastGameError}</p>}
            <button
              className="secondary-button"
              onClick={handleDecryptLastGame}
              disabled={!isConnected || zamaLoading || decryptingGame || !lastGame}
            >
              {decryptingGame ? 'Decrypting...' : 'Decrypt Last Game'}
            </button>
          </article>

          <article className="info-card">
            <h2>Play Arena Game</h2>
            <p className="info-line">Each game costs 10 points. Win to earn 20 points.</p>
            <label className="input-label" htmlFor="arena-guess">
              Enter your guess (0 - 99)
            </label>
            <input
              id="arena-guess"
              type="number"
              min={0}
              max={99}
              value={playInput}
              onChange={event => setPlayInput(event.target.value)}
              className="number-input"
            />
            {playError && <p className="error-text">{playError}</p>}
            <button
              className="primary-button"
              onClick={handlePlay}
              disabled={!isConnected || !isRegistered || zamaLoading || isFetching}
            >
              Start Game
            </button>
          </article>
        </section>
      </main>
    </div>
  );
}
