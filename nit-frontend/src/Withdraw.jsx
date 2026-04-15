import { useState, useEffect } from "react";
import { Sidebar, Topbar, Footer } from "./Dashboard";
import "./finvault.css";

const CONTRACT_ADDRESS = "0x43a4B9049cF78642539b2e6e6a58330b30dB1689"; 

export default function Withdraw({ onNavigate, connectWallet, isWalletConnected, account }) {
  const [status, setStatus] = useState(null);
  const [balanceETH, setBalanceETH] = useState("0.0");

  // Fetch the user's balance when they visit the page
  useEffect(() => {
    async function fetchBalance() {
      if(isWalletConnected && account) {
        try {
          const ethers = await import('ethers');
          const provider = new ethers.BrowserProvider(window.ethereum);
          const vaultAbi = ['function balances(address) view returns (uint256)'];
          const contract = new ethers.Contract(CONTRACT_ADDRESS, vaultAbi, provider);
          
          const weiBalance = await contract.balances(account);
          setBalanceETH(ethers.formatEther(weiBalance));
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
    }
    fetchBalance();
  }, [isWalletConnected, account]);

  async function handleSubmit() {
    if (!isWalletConnected) {
      setStatus({ type: "error", msg: "Connect MetaMask first!" });
      return;
    }
    if (balanceETH === "0.0") {
      setStatus({ type: "error", msg: "No funds to withdraw!" });
      return;
    }

    try {
      setStatus({ type: "neutral", msg: "Waiting for approval in MetaMask..." });
      const ethers = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const vaultAbi = ['function withdraw() external'];
      const contract = new ethers.Contract(CONTRACT_ADDRESS, vaultAbi, signer);
      
      const tx = await contract.withdraw();
      
      setStatus({ type: "neutral", msg: `Transaction sent! Waiting for confirmation...` });
      await tx.wait();
      
      setStatus({ type: "success", msg: `Withdrawal Successful!` });
      setBalanceETH("0.0"); // Update UI after successful withdrawal
    } catch (error) {
      setStatus({ type: "error", msg: `Withdrawal failed or rejected.` });
    }
  }

  return (
    <div className="fv-layout">
      <Sidebar active="withdraw" onNavigate={onNavigate} />
      <div className="fv-main">
        <Topbar title="Withdraw Funds" connectWallet={connectWallet} isWalletConnected={isWalletConnected} account={account} />
        <div className="fv-content fv-content-split">
          <div className="fv-form-card">
            <h2 className="fv-form-heading">Withdraw from the Vault</h2>
            <p className="fv-form-subtitle">This will return all deposited ETH back to your wallet.</p>

            <div className="fv-balance-bar">
              <span className="fv-info-lbl">Vault Balance Available</span>
              <span className="fv-balance-val">{balanceETH} ETH</span>
            </div>

            <div className="fv-warn-msg">
              Executing this function withdraws your entire balance to {account ? account.substring(0,6) + "..." : "your wallet"}.
            </div>

            <button className="fv-submit-btn wit" disabled={!isWalletConnected || balanceETH === "0.0"} onClick={handleSubmit}>
              Execute Withdrawal
            </button>

            {status && (
              <div className={`fv-status-msg ${status.type}`}>{status.msg}</div>
            )}
          </div>

          <div className="fv-info-card">
             <h3 className="fv-info-heading">Security Notice</h3>
             <p style={{fontSize: '12px', color: '#7f8c8d'}}>
               This vault utilizes the OpenZeppelin ReentrancyGuard to ensure funds are transferred securely. Gas fees apply to network withdrawals.
             </p>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}