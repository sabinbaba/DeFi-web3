import { useState } from "react";
import "./finvault.css";

// Dummy data for visual history (since The Graph handles real history separately)
const transactions = [
  { label: "Deposit", date: "Apr 14, 2026", amount: "+0.005 ETH", type: "credit" },
  { label: "Withdrawal", date: "Apr 12, 2026", amount: "-0.001 ETH", type: "debit" },
];

export default function Dashboard({ onNavigate, connectWallet, isWalletConnected, account, balanceETH }) {
  
  // Convert the real ETH balance to USD dynamically
  const balanceUSD = (parseFloat(balanceETH || 0) * 3500).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});

  const statusItems = [
    { label: "Smart Contract", value: "SecureVault Proxy", color: "green" },
    { label: "Network", value: "Sepolia Testnet", color: "green" },
    { label: "Wallet Connected", value: isWalletConnected && account ? account.slice(0,6) + '...' + account.slice(-4) : 'Not Connected', color: isWalletConnected ? "green" : "red" },
    { label: "Live ETH Balance", value: `${balanceETH} ETH`, color: "neutral" },
  ];

  return (
    <div className="fv-layout">
      <Sidebar active="dashboard" onNavigate={onNavigate} />
      <div className="fv-main">
        <Topbar title="Dashboard" connectWallet={connectWallet} isWalletConnected={isWalletConnected} account={account} />
        <div className="fv-content">
          <div className="fv-metrics">
            <MetricCard label="Total Balance (USD)" value={`$${balanceUSD}`} />
            <MetricCard label="Vault Balance (ETH)" value={`${balanceETH} ETH`} color="green" />
            <MetricCard label="Contract Status" value="Active" color="green" />
          </div>
          <div className="fv-cards-row">
            <div className="fv-card">
              <h3 className="fv-card-title">Recent Transactions</h3>
              {transactions.map((tx, i) => (
                <div className="fv-tx-row" key={i}>
                  <div>
                    <div className="fv-tx-label">{tx.label}</div>
                    <div className="fv-tx-date">{tx.date}</div>
                  </div>
                  <div className={`fv-tx-amount ${tx.type}`}>{tx.amount}</div>
                </div>
              ))}
              <div className="fv-action-row">
                <button className="fv-act-btn dep" onClick={() => onNavigate("deposit")}>Deposit</button>
                <button className="fv-act-btn wit" onClick={() => onNavigate("withdraw")}>Withdraw</button>
              </div>
            </div>
            <div className="fv-card">
              <h3 className="fv-card-title">Account Status</h3>
              {statusItems.map((s, i) => (
                <div className="fv-status-row" key={i}>
                  <span>
                    <span className={`fv-dot ${s.color}`}></span>
                    {s.label}
                  </span>
                  <span className={`fv-status-val ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="fv-metric">
      <div className="fv-metric-label">{label}</div>
      <div className={`fv-metric-value ${color || ""}`}>{value}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS (Used by Dashboard, Deposit, and Withdraw)
// ════════════════════════════════════════════════════════════════════

export function Sidebar({ active, onNavigate }) {
  const links = [
    { key: "dashboard", label: "Dashboard" },
    { key: "deposit", label: "Deposit" },
    { key: "withdraw", label: "Withdraw" },
    { key: "history", label: "History" }, // <-- ADD THIS LINE
  ];
  // ... rest of the sidebar code
  return (
    <div className="fv-sidebar">
      <div className="fv-brand">
        <h2>NIT Vault</h2>
        <p>Dream. Learn. Achieve.</p>
      </div>
      <nav className="fv-nav">
        {links.map((l) => (
          <div
            key={l.key}
            className={`fv-nav-item ${active === l.key ? "active" : ""}`}
            onClick={() => onNavigate(l.key)}
          >
            {l.label}
          </div>
        ))}
      </nav>
      <div className="fv-sidebar-footer">v2.1.0 · Encrypted</div>
    </div>
  );
}

export function Topbar({ title, connectWallet, isWalletConnected, account }) {
  return (
    <div className="fv-topbar">
      <h1 className="fv-topbar-title">{title}</h1>
      <div className="fv-topbar-right">
        <span className="fv-badge">Sepolia Network</span>
        <button className="fv-connect-btn" onClick={connectWallet}>
          {isWalletConnected && account ? `Connected (${account.slice(0,6)}...${account.slice(-4)})` : 'Connect Wallet'}
        </button>
      </div>
    </div>
  );
}

export function Footer() {
  return <div className="fv-footer">© 2026 Nyamagabe Institute of Technology · All transactions encrypted</div>;
}