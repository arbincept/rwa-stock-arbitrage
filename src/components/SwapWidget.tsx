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

const TOKEN_ADDRESSES: Record<string, { in: string; out: string }> = {
  NVDA: { in: '0x55d398326f99059fF775485246999027B3197955', out: '0x101f37e42d70cb26a6ef44b3602492de49a46f25' },
  TSLA: { in: '0x55d398326f99059fF775485246999027B3197955', out: '0x202f37e42d70cb26a6ef44b3602492de49a46f26' },
  AAPL: { in: '0x55d398326f99059fF775485246999027B3197955', out: '0x303f37e42d70cb26a6ef44b3602492de49a46f27' },
  SPY:  { in: '0x55d398326f99059fF775485246999027B3197955', out: '0x404f37e42d70cb26a6ef44b3602492de49a46f28' },
  COIN: { in: '0x55d398326f99059fF775485246999027B3197955', out: '0x505f37e42d70cb26a6ef44b3602492de49a46f29' },
  MSFT: { in: '0x55d398326f99059fF775485246999027B3197955', out: '0x606f37e42d70cb26a6ef44b3602492de49a46f29' },
};

export const SwapWidget: React.FC<SwapWidgetProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock,
}) => {
  const [account, setAccount] = useState<string | null>(null);
  const [amountIn, setAmountIn] = useState<string>('500');
  const [loading, setLoading] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [simulation, setSimulation] = useState<any | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
    const eth = (window as any).ethereum;
    if (eth) {
      eth.on?.('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });
      eth.on?.('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const checkConnection = async () => {
    const eth = (window as any).ethereum;
    if (typeof window !== 'undefined' && eth) {
      try {
        const accounts = await eth.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    }
  };

  const connectWallet = async () => {
    setError(null);
    const eth = (window as any).ethereum;
    if (typeof window === 'undefined' || !eth) {
      setError('Nessun wallet Web3 rilevato. Installa MetaMask o Binance Wallet.');
      return;
    }

    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);

      const chainId = await eth.request({ method: 'eth_chainId' });
      if (chainId !== BSC_CHAIN_ID) {
        try {
          await eth.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_CHAIN_ID }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await eth.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: BSC_CHAIN_ID,
                  chainName: 'Binance Smart Chain Mainnet',
                  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                  rpcUrls: ['https://bsc-dataseed.binance.org/'],
                  blockExplorerUrls: ['https://bscscan.com/'],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Errore durante la connessione al wallet.');
    }
  };

  const currentPair = TOKEN_ADDRESSES[selectedSymbol] || TOKEN_ADDRESSES['NVDA'];

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const quote = {
        fromToken: currentPair.in as `0x${string}`,
        toToken: currentPair.out as `0x${string}`,
        amountIn: amountIn,
      } as unknown as RwaSwapQuoteResponse;

      const sender = account || '0xaff5340ecfaf7ce049261cff193f5fed6bdf04e7';
      const sim = await simulateRwaSwap(quote, sender);
      setSimulation(sim);
    } catch (err: any) {
      setError(err.message || 'Errore durante la simulazione.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSwap = async () => {
    if (!account) {
      await connectWallet();
      if (!account) return;
    }

    if (!simulation || !simulation.transactionRequest) {
      setError('Esegui prima la simulazione per generare il calldata.');
      return;
    }

    setExecuting(true);
    setError(null);
    setTxHash(null);

    try {
      const txRequest = simulation.transactionRequest;
      const eth = (window as any).ethereum;
      const hash = await eth.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: account,
            to: txRequest.to,
            data: txRequest.data,
            value: txRequest.value || '0x0',
          },
        ],
      });
      setTxHash(hash);
    } catch (err: any) {
      setError(err.message || 'Transazione annullata o fallita.');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-base text-slate-100">Spot Swap & Simulation Engine</h3>
          <p className="text-xs text-slate-400">KyberSwap Aggregator + 5 bps Arb Inc Fee</p>
        </div>
        {!account ? (
          <button
            onClick={connectWallet}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-lg shadow-purple-900/20"
          >
            <Wallet className="w-3.5 h-3.5" /> Connect
          </button>
        ) : (
          <span className="bg-slate-800 border border-slate-700 text-xs px-2.5 py-1 rounded-full text-emerald-400 font-mono">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Pay (USDT)</span>
            <span>BSC Mainnet</span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">USDT</span>
          </div>
        </div>

        <div className="flex justify-center -my-1">
          <div className="bg-slate-800 p-1.5 rounded-full border border-slate-700 text-purple-400">
            <ArrowDown className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Receive (Target Asset)</span>
            <select
              value={selectedSymbol}
              onChange={(e) => onSelectStock(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-purple-300 rounded px-1.5 py-0.5 focus:outline-none"
            >
              {stocks && stocks.map((s) => (
                <option key={s.stock.symbol} value={s.stock.symbol}>
                  {s.stock.symbol} ({s.stock.platform})
                </option>
              ))}
            </select>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-purple-300 flex justify-between items-center">
            <span>{simulation ? simulation.simulatedAmountOut : '0.00'}</span>
            <span className="text-xs text-slate-400 font-sans">{selectedSymbol} (BSC)</span>
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading}
          className="w-full bg-slate-800 hover:bg-slate-700 text-purple-300 font-medium py-2 rounded-lg text-sm transition border border-slate-700 flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? 'Simulazione in corso...' : `Simula Zero-Risk ${selectedSymbol} Swap`}
        </button>
      </div>

      {simulation && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            {simulation.success ? 'Calldata Generato (5 bps Fee)' : 'Errore Simulazione'}
          </div>
          <div className="text-slate-300">Min Out: {simulation.minAmountOutGuaranteed}</div>
          <div className="text-slate-300">Est. Gas: {simulation.gasUsed?.toString()} units</div>
          <div className="text-slate-500 truncate">Router: {simulation.transactionRequest?.to}</div>
        </div>
      )}

      {error && <div className="bg-red-950/50 border border-red-800 text-red-300 p-2 rounded-lg text-xs">{error}</div>}

      {txHash && (
        <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-300 p-2 rounded-lg text-xs break-all">
          🎉 Tx Inviata! Hash: <a href={`https://bscscan.com/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline">{txHash}</a>
        </div>
      )}

      {simulation?.transactionRequest && (
        <button
          onClick={handleExecuteSwap}
          disabled={executing}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-lg text-sm transition shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          {executing ? 'Firma nel wallet...' : `Esegui ${selectedSymbol} Swap su BSC Mainnet`}
        </button>
      )}
    </div>
  );
};
