import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export interface WalletState {
  address: string | null;
  chainId: string | null;
  ethBalance: string | null;
  isConnecting: boolean;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    ethBalance: null,
    isConnecting: false,
  });

  const fetchBalance = useCallback(async (addr: string) => {
    try {
      const balanceHex = (await window.ethereum!.request({
        method: "eth_getBalance",
        params: [addr, "latest"],
      })) as string;
      const wei = BigInt(balanceHex);
      const eth = Number(wei) / 1e18;
      setState((s) => ({ ...s, ethBalance: eth.toFixed(4) }));
    } catch {
      setState((s) => ({ ...s, ethBalance: null }));
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected", {
        description: "Install MetaMask to connect your wallet.",
      });
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    setState((s) => ({ ...s, isConnecting: true }));
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const chainId = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;
      const address = accounts[0];
      setState({ address, chainId, ethBalance: null, isConnecting: false });
      await fetchBalance(address);
      toast.success("Wallet connected", {
        description: `${address.slice(0, 6)}…${address.slice(-4)}`,
      });
    } catch (err) {
      setState((s) => ({ ...s, isConnecting: false }));
      toast.error("Connection rejected");
    }
  }, [fetchBalance]);

  const disconnect = useCallback(() => {
    setState({ address: null, chainId: null, ethBalance: null, isConnecting: false });
    toast("Wallet disconnected");
  }, []);

  useEffect(() => {
    if (!window.ethereum?.on) return;
    const handleAccounts = (...args: unknown[]) => {
      const accs = args[0] as string[];
      if (!accs || accs.length === 0) {
        setState({ address: null, chainId: null, ethBalance: null, isConnecting: false });
      } else {
        setState((s) => ({ ...s, address: accs[0] }));
        fetchBalance(accs[0]);
      }
    };
    const handleChain = (...args: unknown[]) => {
      setState((s) => ({ ...s, chainId: args[0] as string }));
    };
    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccounts);
      window.ethereum?.removeListener?.("chainChanged", handleChain);
    };
  }, [fetchBalance]);

  return { ...state, connect, disconnect };
}

export function chainName(chainId: string | null): string {
  if (!chainId) return "—";
  const map: Record<string, string> = {
    "0x1": "Ethereum",
    "0x5": "Goerli",
    "0xaa36a7": "Sepolia",
    "0x89": "Polygon",
    "0x13881": "Mumbai",
    "0xa": "Optimism",
    "0xa4b1": "Arbitrum",
    "0x2105": "Base",
    "0x38": "BSC",
  };
  return map[chainId] ?? `Chain ${parseInt(chainId, 16)}`;
}
