import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import Deposit from "./Deposit";
import Withdraw from "./Withdraw";

const CONTRACT_ADDRESS = "0x43a4B9049cF78642539b2e6e6a58330b30dB1689";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [account, setAccount] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [balanceETH, setBalanceETH] = useState("0.0");

  // 1. Function to fetch the real balance from the blockchain
  const fetchBalance = async (userAccount) => {
    if (!userAccount) return;
    try {
      const ethers = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const vaultAbi = ['function balances(address) view returns (uint256)'];
      const contract = new ethers.Contract(CONTRACT_ADDRESS, vaultAbi, provider);
      
      const weiBalance = await contract.balances(userAccount);
      setBalanceETH(ethers.formatEther(weiBalance));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  // 2. Monitor Wallet Connections
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum && window.ethereum.selectedAddress) {
        setAccount(window.ethereum.selectedAddress);
        setIsWalletConnected(true);
        fetchBalance(window.ethereum.selectedAddress); // Fetch on load
      }
    };
    checkConnection();

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsWalletConnected(true);
        fetchBalance(accounts[0]); // Fetch when switching accounts
      } else {
        setAccount('');
        setIsWalletConnected(false);
        setBalanceETH("0.0");
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
        setIsWalletConnected(true);
        fetchBalance(accounts[0]);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert('Please install MetaMask to connect!');
    }
  };

  // 3. Pass the dynamic balance and fetch function to all pages
  const pageProps = {
    onNavigate: setPage,
    account,
    isWalletConnected,
    connectWallet,
    balanceETH,     // NEW: Real ETH balance
    fetchBalance    // NEW: Function to trigger an update after depositing
  };

  return (
    <>
      {page === "dashboard" && <Dashboard {...pageProps} />}
      {page === "deposit"   && <Deposit   {...pageProps} />}
      {page === "withdraw"  && <Withdraw  {...pageProps} />}
    </>
  );
}