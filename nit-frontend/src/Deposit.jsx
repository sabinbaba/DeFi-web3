import { useState } from "react";
import { Sidebar, Topbar, Footer } from "./Dashboard";
import "./finvault.css";

const QUICK_AMOUNTS = [0.01, 0.05, 0.1, 0.5];
const ETH_PRICE_USD = 3500; // Estimated conversion rate
const CONTRACT_ADDRESS = "0x43a4B9049cF78642539b2e6e6a58330b30dB1689"; 

export default function Deposit({ onNavigate, connectWallet, isWalletConnected, account, fetchBalance }) {
  const [amount, setAmount] = useState("");
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState(null);

  const canSubmit = amount > 0;

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

    try {
      setStatus({ type: "neutral", msg: "Waiting for approval in MetaMask..." });
      
      const ethers = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const vaultAbi = ['function deposit() external payable'];
      const contract = new ethers.Contract(CONTRACT_ADDRESS, vaultAbi, signer);
      
      // Convert the string amount to Wei
      const weiValue = ethers.parseEther(amount.toString());
      
      // Execute the deposit
      const tx = await contract.deposit({ value: weiValue });
      
      setStatus({ type: "neutral", msg: `Transaction sent! Waiting for block confirmation...` });
      
      // Wait for it to be mined
      await tx.wait();
      
      setStatus({ type: "success", msg: `Successfully Deposited ${amount} ETH!` });
      setAmount("");
      
      // Ping App.jsx to update the global balance!
      if (fetchBalance && account) {
        fetchBalance(account);
      }
      
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", msg: `Deposit failed or rejected by user.` });
    }
  }

  // Calculate estimated USD value based on current input
  const estimatedUSD = amount ? (parseFloat(amount) * ETH_PRICE_USD).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00";

  return (
    <div className="fv-layout">
      <Sidebar active="deposit" onNavigate={onNavigate} />
      <div className="fv-main">
        <Topbar title="Deposit Funds" connectWallet={connectWallet} isWalletConnected={isWalletConnected} account={account} />
        <div className="fv-content fv-content-split">
          <div className="fv-form-card">
            <h2 className="fv-form-heading">Add ETH to the Vault</h2>
            <p className="fv-form-subtitle">Current estimated rate: 1 ETH = ${ETH_PRICE_USD.toLocaleString()}</p>

            <div className="fv-field">
              <label className="fv-label">Amount (ETH)</label>
              <div className="fv-amount-wrap">
                <span className="fv-currency">ETH</span>
                <input
                  type="number"
                  className="fv-input"
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
                    className={`fv-qa ${selected === v ? "sel" : ""}`}
                    onClick={() => handleQuick(v)}
                  >
                    {v} ETH
                  </button>
                ))}
              </div>
            </div>

            <button className="fv-submit-btn dep" disabled={!canSubmit} onClick={handleSubmit}>
              Confirm Deposit via MetaMask
            </button>

            {status && (
              <div className={`fv-status-msg ${status.type}`}>{status.msg}</div>
            )}
          </div>

          <div className="fv-info-card">
            <h3 className="fv-info-heading">Network Summary</h3>
            {[
              ["Network", "Ethereum Sepolia"],
              ["Contract", CONTRACT_ADDRESS.substring(0,6) + "..." + CONTRACT_ADDRESS.substring(38)],
              ["Currency", "ETH"],
              ["Processing", "~ 15 seconds"],
              ["Gas Fee", "Network variable"],
            ].map(([l, v]) => (
              <div className="fv-info-row" key={l}>
                <span className="fv-info-lbl">{l}</span>
                <span className="fv-info-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}