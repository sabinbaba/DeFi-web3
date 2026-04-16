import { useState, useEffect } from "react";
import { Sidebar, Topbar, Footer } from "./Dashboard";
import "./finvault.css";

const GRAPH_URL = "https://api.studio.thegraph.com/query/1748139/secure-vault-nit/0.0.1";

export default function History({ onNavigate, connectWallet, isWalletConnected, account }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [timeFilter, setTimeFilter] = useState("all"); 
  const [searchStatus, setSearchStatus] = useState("Showing recent transactions");

  const executeSearch = async () => {
    setLoading(true);
    let query = "";
    const cleanInput = searchInput.trim().toLowerCase();

    // 1. Calculate Unix Timestamps for the time filter (Including minute-level filters)
    const nowUnix = Math.floor(Date.now() / 1000);
    let timeClause = "";
    
    if (timeFilter === "1m") {
      timeClause = `blockTimestamp_gte: "${nowUnix - 60}"`;
    } else if (timeFilter === "2m") {
      timeClause = `blockTimestamp_gte: "${nowUnix - 120}"`;
    } else if (timeFilter === "3m") {
      timeClause = `blockTimestamp_gte: "${nowUnix - 180}"`;
    } else if (timeFilter === "5m") {
      timeClause = `blockTimestamp_gte: "${nowUnix - 300}"`;
    } else if (timeFilter === "24h") {
      timeClause = `blockTimestamp_gte: "${nowUnix - 86400}"`;
    } else if (timeFilter === "7d") {
      timeClause = `blockTimestamp_gte: "${nowUnix - 604800}"`;
    } else if (timeFilter === "30d") {
      timeClause = `blockTimestamp_gte: "${nowUnix - 2592000}"`;
    }

    // 2. Build the GraphQL Query based on inputs
    if (cleanInput.length === 66 && cleanInput.startsWith("0x")) {
      // Exact Transaction Hash
      setSearchStatus(`Showing exact match for transaction: ${cleanInput.substring(0, 10)}...`);
      query = `
        {
          depositeds(where: { transactionHash: "${cleanInput}" }) {
            id user amount blockTimestamp transactionHash
          }
        }
      `;
    } 
    else if (cleanInput.length === 42 && cleanInput.startsWith("0x")) {
      // Wallet Address + Time Filter
      setSearchStatus(`Showing deposits for wallet: ${cleanInput.substring(0, 6)}...`);
      const whereFilters = [`user: "${cleanInput}"`];
      if (timeClause) whereFilters.push(timeClause);
      
      query = `
        {
          depositeds(where: { ${whereFilters.join(", ")} }, orderBy: blockTimestamp, orderDirection: desc) {
            id user amount blockTimestamp transactionHash
          }
        }
      `;
    } 
    else {
      // Default: Just Time Filter (or All Time)
      setSearchStatus(cleanInput ? "Invalid Hash/Address. Showing recent transactions." : "Showing recent transactions");
      const whereFilters = [];
      if (timeClause) whereFilters.push(timeClause);
      
      const whereString = whereFilters.length > 0 ? `where: { ${whereFilters.join(", ")} },` : "";
      
      query = `
        {
          depositeds(first: 100, ${whereString} orderBy: blockTimestamp, orderDirection: desc) {
            id user amount blockTimestamp transactionHash
          }
        }
      `;
    }

    // 3. Execute the Query
    try {
      const response = await fetch(GRAPH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      
      if (result.data && result.data.depositeds) {
        const formattedTxs = result.data.depositeds.map(tx => ({
          hash: tx.transactionHash,
          user: tx.user,
          amount: (Number(tx.amount) / 1e18).toFixed(4),
          date: new Date(tx.blockTimestamp * 1000).toLocaleString(),
        }));
        setTransactions(formattedTxs);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching from The Graph:", error);
      setSearchStatus("Error connecting to database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter]);

  return (
    <div className="fv-layout">
      <Sidebar active="history" onNavigate={onNavigate} />
      <div className="fv-main">
        <Topbar title="Audit Trail" connectWallet={connectWallet} isWalletConnected={isWalletConnected} account={account} />
        
        <div className="fv-content">
          <div className="fv-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h2 className="fv-form-heading">Blockchain Explorer</h2>
                <p className="fv-form-subtitle">{searchStatus}</p>
              </div>
              
              {/* Controls Container */}
              <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '500px' }}>
                
                {/* NEW: Updated Time Filter Dropdown */}
                <select 
                  className="fv-input" 
                  value={timeFilter} 
                  onChange={(e) => setTimeFilter(e.target.value)}
                  style={{ width: '150px', backgroundColor: '#f9fbfd', cursor: 'pointer' }}
                >
                  <option value="all">All Time</option>
                  <option value="1m">Last 1 Min</option>
                  <option value="2m">Last 2 Mins</option>
                  <option value="3m">Last 3 Mins</option>
                  <option value="5m">Last 5 Mins</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>

                {/* The Search Input */}
                <input
                  type="text"
                  className="fv-input"
                  placeholder="Paste Tx Hash or Wallet..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                  style={{ backgroundColor: '#f9fbfd', flex: 1 }}
                />
                <button 
                  className="fv-submit-btn dep" 
                  style={{ width: 'auto', margin: 0, padding: '10px 20px' }}
                  onClick={executeSearch}
                >
                  Search
                </button>
              </div>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>Querying The Graph API...</p>
            ) : transactions.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#e74c3c' }}>No transactions found for this period/query.</p>
            ) : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e0e4ea', color: '#7f8c8d', fontSize: '13px' }}>
                    <th style={{ padding: '10px 0' }}>Date</th>
                    <th>User Wallet</th>
                    <th>Amount (ETH)</th>
                    <th>Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.hash} style={{ borderBottom: '1px solid #f1f3f5', fontSize: '14px' }}>
                      <td style={{ padding: '12px 0' }}>{tx.date}</td>
                      <td style={{ color: '#3498db', fontFamily: 'monospace' }}>{tx.user.substring(0, 6)}...{tx.user.substring(38)}</td>
                      <td style={{ color: '#2ecc71', fontWeight: 'bold' }}>+{tx.amount}</td>
                      <td>
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${tx.hash}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: '#7f8c8d', textDecoration: 'none', fontFamily: 'monospace' }}
                        >
                          {tx.hash.substring(0, 15)}...
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}