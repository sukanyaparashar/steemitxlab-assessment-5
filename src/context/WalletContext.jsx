import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";

// ─────────────────────────────────────────────────────────────
// CONFIGURATION — change EXPECTED_CHAIN_ID to target any network
// e.g. 1 = Ethereum mainnet, 11155111 = Sepolia
// ─────────────────────────────────────────────────────────────
export const EXPECTED_CHAIN_ID = 11155111; // Sepolia

export const NETWORK_NAMES = {
  1: "Ethereum",
  11155111: "Sepolia",
  137: "Polygon",
  80001: "Mumbai",
  42161: "Arbitrum",
  10: "Optimism",
  8453: "Base",
};

export const NATIVE_SYMBOLS = {
  1: "ETH",
  11155111: "ETH",
  137: "MATIC",
  80001: "MATIC",
  42161: "ETH",
  10: "ETH",
  8453: "ETH",
};

function formatBalance(raw, symbol = "ETH") {
  const num = parseFloat(ethers.utils.formatEther(raw));
  return `${num.toFixed(4).replace(/\.?0+$/, "")} ${symbol}`;
}

function truncateAddress(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ─────────────────────────────────────────────────────────────
const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null); // 'no_wallet'|'rejected'|'unknown'
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState(null); // 'wrong_network'|'rpc_error'
  const [isSwitching, setIsSwitching] = useState(false); // switching network in progress

  const isConnected = !!address;
  const isCorrectNetwork = isConnected && chainId === EXPECTED_CHAIN_ID;
  const networkName = chainId
    ? (NETWORK_NAMES[chainId] ?? `Chain ${chainId}`)
    : null;
  const expectedName =
    NETWORK_NAMES[EXPECTED_CHAIN_ID] ?? `Chain ${EXPECTED_CHAIN_ID}`;

  // ── Fetch native balance ────────────────────────────────────
  const fetchBalance = useCallback(async (addr, currentChainId) => {
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork(); // verify RPC is alive

      if (network.chainId !== EXPECTED_CHAIN_ID) {
        setBalanceError("wrong_network");
        setBalance(null);
        return;
      }

      const symbol = NATIVE_SYMBOLS[network.chainId] ?? "ETH";
      const raw = await provider.getBalance(addr);
      setBalance(formatBalance(raw, symbol));
    } catch (err) {
      console.error("Balance fetch failed:", err);
      setBalanceError("rpc_error");
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  // ── Connect ─────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("no_wallet");
      return;
    }
    setIsConnecting(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      setAddress(accounts[0]);
      setChainId(network.chainId);
      await fetchBalance(accounts[0], network.chainId);
    } catch (err) {
      setError(err.code === 4001 ? "rejected" : "unknown");
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalance]);

  // ── Disconnect ───────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setBalance(null);
    setBalanceError(null);
    setError(null);
  }, []);

  // ── Switch to expected network ───────────────────────────────
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    setIsSwitching(true);
    const chainIdHex = `0x${EXPECTED_CHAIN_ID.toString(16)}`;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
      // chainChanged event will fire and update chainId + refetch balance
    } catch (err) {
      if (err.code === 4902) {
        // Chain not added to MetaMask yet — nothing we can do silently
        console.warn("Chain not in wallet. User must add it manually.");
      } else {
        console.error("Switch network failed:", err);
      }
    } finally {
      setIsSwitching(false);
    }
  }, []);

  // ── MetaMask event listeners ─────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setChainId(null);
        setBalance(null);
        setBalanceError(null);
      } else {
        setAddress(accounts[0]);
        fetchBalance(accounts[0], chainId);
      }
    };

    const onChainChanged = (hex) => {
      const newChainId = parseInt(hex, 16);
      setChainId(newChainId);
      setBalance(null);
      setBalanceError(null);
      if (address) fetchBalance(address, newChainId);
    };

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged", onChainChanged);
    };
  }, [address, chainId, fetchBalance]);

  return (
    <WalletContext.Provider
      value={{
        // identity
        address,
        truncatedAddress: address ? truncateAddress(address) : null,
        chainId,
        networkName,
        expectedName,
        // status
        isConnected,
        isCorrectNetwork,
        isConnecting,
        isSwitching,
        error,
        // balance
        balance,
        balanceLoading,
        balanceError,
        // actions
        connect,
        disconnect,
        switchNetwork,
        fetchBalance: () => address && fetchBalance(address, chainId),
        clearError: () => setError(null),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
