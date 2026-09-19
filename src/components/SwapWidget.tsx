import React, { useState, useEffect } from 'react';
import { simulateRwaSwap } from '../engine/simulator';
import type { RwaSwapQuoteResponse, StockPriceData } from '../types/rwa';
import { ArrowDown, CheckCircle2, ShieldCheck, Zap, RefreshCw, Wallet } from 'lucide-react';

interface SwapWidgetProps {
  stocks: StockPriceData[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
}

const BSC_CHAIN_ID = '0x38'; // 56
const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955' as const;
const BNB_NATIVE = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as const;

export const SwapWidget: React.FC<SwapWidgetProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock,
}) => {
  const panelStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #111827 0%, #0b1220 100%)',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    borderRadius: 16,
    padding: 20,
    color: '#f8fafc',
    boxShadow: '0 18px 48px rgba(0, 0, 0, 0.28)',
  };
  const fieldStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: '#070b12',
    border: '1px solid #263244',
    borderRadius: 9,
    padding: '10px 12px',
    color: '#f8fafc',
    fontSize: 14,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  };
  const selectStyle: React.CSSProperties = {
    background: '#070b12',
    border: '1px solid #334155',
    borderRadius: 7,
    color: '#c4b5fd',
    padding: '5px 8px',
    fontSize: 12,
  };
  const [account, setAccount] = useState<string | null>(null);
  const [tradeDirection, setTradeDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [settlementAsset, setSettlementAsset] = useState<'USDT' | 'BNB'>('USDT');
  const [amountIn, setAmountIn] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [simulation, setSimulation] = useState<any | null>(null);
  const [preflighted, setPreflighted] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getProvider = () => {
    if (typeof window === 'undefined') return null;
    const win = window as any;
    return win.ethereum || win.BinanceChain || null;
  };

  useEffect(() => {
    const provider = getProvider();
    if (provider) {
      provider.request({ method: 'eth_accounts' }).then((accs: string[]) => {
        if (accs && accs.length > 0) setAccount(accs[0]);
      }).catch(console.error);

      provider.on?.('accountsChanged', (accs: string[]) => setAccount(accs[0] || null));
      provider.on?.('chainChanged', () => window.location.reload());
    }
  }, []);

  const connectWallet = async () => {
    setError(null);
    const provider = getProvider();
    if (!provider) {
      setError('No wallet detected. Unlock your wallet extension and try again.');
      return;
    }

    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
      }

      const chainId = await provider.request({ method: 'eth_chainId' });
      if (chainId !== BSC_CHAIN_ID) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_CHAIN_ID }],
          });
        } catch (switchErr: any) {
          if (switchErr.code === 4902 || switchErr.code === -32603) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: BSC_CHAIN_ID,
                chainName: 'Binance Smart Chain Mainnet',
                nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
              }],
            });
          } else {
            throw switchErr;
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Wallet connection was rejected.');
    }
  };

  const selectedStock = stocks.find((stock) => stock.stock.symbol === selectedSymbol) ?? stocks[0];
  const inputAsset = tradeDirection === 'BUY' ? settlementAsset : selectedSymbol;
  const outputAsset = tradeDirection === 'BUY' ? selectedSymbol : settlementAsset;
  const inputToken = tradeDirection === 'BUY'
    ? (settlementAsset === 'BNB' ? BNB_NATIVE : USDT_BSC)
    : selectedStock?.stock.address;
  const outputToken = tradeDirection === 'BUY'
    ? selectedStock?.stock.address
    : (settlementAsset === 'BNB' ? BNB_NATIVE : USDT_BSC);

  const resetQuote = () => {
    setSimulation(null);
    setPreflighted(false);
    setTxHash(null);
    setError(null);
  };

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    setPreflighted(false);
    try {
      if (!selectedStock || !inputToken || !outputToken) {
        throw new Error('No verified RWA asset is available.');
      }
      if (!amountIn || Number(amountIn) <= 0) {
        throw new Error('Enter an amount greater than zero.');
      }

      const quote = {
        fromToken: inputToken,
        toToken: outputToken,
        amountIn: amountIn,
      } as unknown as RwaSwapQuoteResponse;

      const sender = account || '0xaff5340ecfaf7ce049261cff193f5fed6bdf04e7';
      const sim = await simulateRwaSwap(quote, sender);
      setSimulation(sim);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve a live quote.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSwap = async () => {
    const provider = getProvider();
    if (!account || !provider) {
      await connectWallet();
      return;
    }

    if (!simulation || !simulation.transactionRequest) {
      setError('Get a live quote before executing the swap.');
      return;
    }

    setExecuting(true);
    setError(null);
    setTxHash(null);
    setPreflighted(false);

    try {
      const txRequest = simulation.transactionRequest;
      const call = {
        from: account,
        to: txRequest.to,
        data: txRequest.data,
        value: txRequest.value || '0x0',
      };

      const gasEstimate = await provider.request({
        method: 'eth_estimateGas',
        params: [call],
      });

      await provider.request({
        method: 'eth_call',
        params: [call, 'latest'],
      });
      setPreflighted(true);

      const hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          ...call,
          gas: gasEstimate,
        }],
      });
      setTxHash(hash);
    } catch (err: any) {
      setError(err.message || 'Transaction cancelled.');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '1px solid #263244', paddingBottom: 14, marginBottom: 18 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, color: '#f8fafc' }}>Spot Swap &amp; Simulation Engine</h3>
          <p style={{ margin: '5px 0 0', fontSize: 12, color: '#94a3b8' }}>KyberSwap Aggregator · 5 bps Arb Inc fee</p>
        </div>
        {!account ? (
          <button
            onClick={connectWallet}
            style={{ border: 0, borderRadius: 8, background: '#7c3aed', color: '#fff', padding: '9px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <Wallet size={14} /> Connect wallet
          </button>
        ) : (
          <span style={{ background: '#0f2d25', border: '1px solid #1f6f55', color: '#6ee7b7', borderRadius: 999, padding: '7px 10px', fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 4, background: '#070b12', border: '1px solid #263244', borderRadius: 10 }}>
          {(['BUY', 'SELL'] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => { setTradeDirection(direction); resetQuote(); }}
              style={{ border: 0, borderRadius: 7, padding: '9px 8px', background: tradeDirection === direction ? '#7c3aed' : 'transparent', color: tradeDirection === direction ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              {direction === 'BUY' ? 'Buy RWA stock' : 'Sell RWA stock'}
            </button>
          ))}
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6, color: '#94a3b8', fontSize: 12 }}>
            <span>{tradeDirection === 'BUY' ? 'Pay with' : 'Sell'}</span>
            {tradeDirection === 'BUY' ? <select
              value={settlementAsset}
              onChange={(e) => {
                setSettlementAsset(e.target.value as 'USDT' | 'BNB');
                resetQuote();
              }}
              style={selectStyle}
            >
              <option value="USDT">USDT</option>
              <option value="BNB">BNB</option>
            </select> : <strong style={{ color: '#c4b5fd' }}>{selectedSymbol}</strong>}
            <span>BSC Mainnet</span>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={amountIn}
              onChange={(e) => {
                setAmountIn(e.target.value);
                setSimulation(null);
                setPreflighted(false);
              }}
              style={{ ...fieldStyle, paddingRight: 64 }}
            />
            <span style={{ position: 'absolute', right: 12, top: 11, color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>{inputAsset}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
          <div style={{ background: '#1e293b', padding: 7, borderRadius: 999, border: '1px solid #334155', color: '#a78bfa' }}>
            <ArrowDown size={16} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6, color: '#94a3b8', fontSize: 12 }}>
            <span>{tradeDirection === 'BUY' ? 'Receive' : 'Receive'}</span>
            {tradeDirection === 'BUY' ? <select
              value={selectedSymbol}
              onChange={(e) => {
                onSelectStock(e.target.value);
                resetQuote();
              }}
              style={{ ...selectStyle, maxWidth: '64%' }}
            >
              {stocks && stocks.map((s) => (
                <option key={s.stock.symbol} value={s.stock.symbol}>
                  {s.stock.symbol} ({s.stock.platform})
                </option>
              ))}
            </select> : <select
              value={settlementAsset}
              onChange={(e) => {
                setSettlementAsset(e.target.value as 'USDT' | 'BNB');
                resetQuote();
              }}
              style={selectStyle}
            >
              <option value="USDT">USDT</option>
              <option value="BNB">BNB</option>
            </select>}
          </div>
          <div style={{ ...fieldStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#c4b5fd' }}>
            <span>{simulation ? simulation.simulatedAmountOut : '—'}</span>
            <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'inherit' }}>{outputAsset}</span>
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading}
          style={{ width: '100%', border: '1px solid #3b4960', borderRadius: 9, background: '#1e293b', color: '#c4b5fd', padding: '11px 12px', fontSize: 13, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? 'Finding the best route...' : `Get live ${tradeDirection === 'BUY' ? 'buy' : 'sell'} quote`}
        </button>
      </div>

      {simulation && (
        <div style={{ background: '#070b12', border: '1px solid #263244', borderRadius: 10, padding: 14, fontSize: 13, display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: simulation.success ? '#6ee7b7' : '#fca5a5', fontWeight: 750 }}>
            <CheckCircle2 size={16} />
            {simulation.success ? (preflighted ? 'RPC preflight passed' : 'Live quote ready') : 'Quote failed'}
          </div>
          {simulation.success && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: '#111827', borderRadius: 8, padding: 10 }}>
                  <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}>Estimated output</div>
                  <strong style={{ color: '#c4b5fd', fontSize: 16 }}>{simulation.simulatedAmountOut} {outputAsset}</strong>
                </div>
                <div style={{ background: '#111827', borderRadius: 8, padding: 10 }}>
                  <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}>Minimum received</div>
                  <strong style={{ color: '#f8fafc', fontSize: 16 }}>{simulation.minAmountOutGuaranteed} {outputAsset}</strong>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 5, color: '#cbd5e1' }}>
                <div><strong>Estimated network cost:</strong> ${Number(simulation.estimatedGasCostUsd || 0).toFixed(2)} ({simulation.estimatedGasCostBnb} BNB)</div>
                <div><strong>Price protection:</strong> minimum output with a maximum 0.5% slippage</div>
                <div style={{ color: '#94a3b8' }}><strong>Next:</strong> connect your wallet, then run the preflight before signing.</div>
              </div>
              <details style={{ color: '#64748b', fontSize: 11 }}>
                <summary style={{ cursor: 'pointer' }}>Dettagli tecnici</summary>
                <div style={{ marginTop: 7, overflowWrap: 'anywhere' }}>Router Kyber: {simulation.transactionRequest?.to}</div>
                <div>Gas stimato: {simulation.gasUsed?.toString()} unità</div>
              </details>
            </>
          )}
        </div>
      )}

      {error && <div style={{ background: '#2a1015', border: '1px solid #7f1d1d', color: '#fca5a5', padding: 10, borderRadius: 9, fontSize: 12 }}>{error}</div>}

      {txHash && (
        <div style={{ background: '#06251c', border: '1px solid #166534', color: '#86efac', padding: 10, borderRadius: 9, fontSize: 12, wordBreak: 'break-word' }}>
          Transaction sent. Hash: <a href={`https://bscscan.com/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ color: '#bbf7d0', textDecoration: 'underline' }}>{txHash}</a>
        </div>
      )}

      {simulation?.transactionRequest && (
        <button
          onClick={handleExecuteSwap}
          disabled={executing}
          style={{ width: '100%', border: 0, borderRadius: 9, background: 'linear-gradient(90deg, #7c3aed, #4f46e5)', color: '#fff', padding: '12px', fontSize: 13, fontWeight: 800, cursor: executing ? 'wait' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
        >
          <ShieldCheck size={16} />
          {executing ? 'Waiting for wallet signature...' : `Execute ${tradeDirection === 'BUY' ? 'buy' : 'sell'} on BSC`}
        </button>
      )}
    </div>
  );
};
