import { useState, useEffect } from "react";
import { Sidebar, Topbar, Footer } from "./Dashboard";
import "./finvault.css";

const QUICK_AMOUNTS = [0.01, 0.05, 0.1, 0.5];
const ETH_PRICE_USD = 3500; // Estimated conversion rate
const CONTRACT_ADDRESS = "0x43a4B9049cF78642539b2e6e6a58330b30dB1689"; 

export default function Withdraw({ onNavigate, connectWallet, isWalletConnected, account, balanceETH, fetchBalance }) {
  const [amount, setAmount] = useState("");
  const [dest, setDest] = useState("");
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState(null);

  // Check if they have entered an amount and selected a destination
  const canSubmit = amount > 0 && dest;

  function handleQuick(val) {
    setAmount(val);
    setSelected(val);
  }

  async function handleSubmit() {
    if (!isWalletConnected) {
      setStatus({ type: "error", msg: "Connect MetaMask first!" });
      return;
    }
    if (!canSubmit) return;

    // Security Check: Ensure they aren't trying to withdraw more than they have
    const withdrawAmount = parseFloat(amount);
    const currentBalance = parseFloat(balanceETH || "0");

    if (withdrawAmount > currentBalance) {
      setStatus({ type: "error", msg: "Insufficient balance for this withdrawal." });
      return;
    }

    try {
      setStatus({ type: "neutral", msg: "Waiting for approval in MetaMask..." });
      
      const ethers = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // NOTE: We changed the ABI to use your safeWithdraw function!
      const vaultAbi = ['function safeWithdraw(uint256 amount) external'];
      const contract = new ethers.Contract(CONTRACT_ADDRESS, vaultAbi, signer);
      
      const weiValue = ethers.parseEther(amount.toString());
      const tx = await contract.safeWithdraw(weiValue);
      
      setStatus({ type: "neutral", msg: `Transaction sent! Waiting for confirmation...` });
      await tx.wait();
      
      setStatus({ type: "success", msg: `Successfully withdrew ${amount} ETH!` });
      setAmount("");
      
      // Update global balance in App.jsx
      if (fetchBalance && account) {
        fetchBalance(account);
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", msg: `Withdrawal failed or rejected.` });
    }
  }

  // Calculate estimated USD value
  const estimatedUSD = amount ? (parseFloat(amount) * ETH_PRICE_USD).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00";
  const balanceUSD = (parseFloat(balanceETH || 0) * ETH_PRICE_USD).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});

  return (
    <div className="fv-layout">
      <Sidebar active="withdraw" onNavigate={onNavigate} />
      <div className="fv-main">
        <Topbar title="Withdraw Funds" connectWallet={connectWallet} isWalletConnected={isWalletConnected} account={account} />
        <div className="fv-content fv-content-split">
          <div className="fv-form-card">
            <h2 className="fv-form-heading">Withdraw to your Wallet</h2>
            <p className="fv-form-subtitle">Withdraw partial or full amounts directly to your connected address.</p>

            <div className="fv-balance-bar">
              <span className="fv-info-lbl">Available balance</span>
              <span className="fv-balance-val">{balanceETH} ETH (${balanceUSD})</span>
            </div>

            <div className="fv-field">
              <label className="fv-label">Amount (ETH)</label>
              <div className="fv-amount-wrap">
                <span className="fv-currency">ETH</span>
                <input
                  type="number"
                  className="fv-input fv-input-wit"
                  placeholder="0.00"
                  min="0.001"
                  step="0.001"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setSelected(null); }}
                />
              </div>
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#7f8c8d' }}>
                ≈ ${estimatedUSD} USD
              </div>
              <div className="fv-quick-amounts">
                {QUICK_AMOUNTS.map((v) => (
                  <button
                    key={v}
                    className={`fv-qa wit ${selected === v ? "sel" : ""}`}
                    onClick={() => handleQuick(v)}
                  >
                    {v} ETH
                  </button>
                ))}
              </div>
            </div>

            {/* Destination Dropdown (Visual Only for the Dashboard theme) */}
            <div className="fv-field">
              <label className="fv-label">Destination</label>
              <select className="fv-input" value={dest} onChange={(e) => setDest(e.target.value)}>
                <option value="">Select account...</option>
                <option value="wallet">Connected Web3 Wallet ({account ? account.substring(0,6) + "..." : "MetaMask"})</option>
              </select>
            </div>

            <div className="fv-field">
              <label className="fv-label">Withdrawal Reason (optional)</label>
              <input
                type="text"
                className="fv-input"
                placeholder="e.g. Rent payment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <button className="fv-submit-btn wit" disabled={!canSubmit} onClick={handleSubmit}>
              Confirm Withdrawal via MetaMask
            </button>

            {status && (
              <div className={`fv-status-msg ${status.type}`}>{status.msg}</div>
            )}
          </div>

          <div className="fv-info-card">
            <h3 className="fv-info-heading">Withdrawal Security</h3>
            {[
              ["Contract", "ReentrancyGuard"],
              ["Limit", "Available Balance"],
              ["Processing", "~ 15 seconds"],
              ["Fee", "Network Gas"],
              ["Destination", "Origin Wallet Only"],
            ].map(([l, v, c]) => (
              <div className="fv-info-row" key={l}>
                <span className="fv-info-lbl">{l}</span>
                <span className={`fv-info-val ${c || ""}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}