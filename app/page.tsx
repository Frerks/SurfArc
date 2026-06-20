'use client'

import { useState, useEffect } from 'react'
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers'

const CONTRACT_ADDRESS = '0xdbe14257a79354474Ce0e4067ddaDB772130F365'
const ARC_RPC = 'https://rpc.testnet.arc.network'
const ARCSCAN = 'https://testnet.arcscan.app'
const ARC_CHAIN_ID = 5042002

const MINI_ABI = [
  "function totalReports() external view returns (uint256)",
  "function totalPaid() external view returns (uint256)",
  "function getReport(string spotId) external view returns (tuple(address reporter, string spotId, string dataHash, uint8 waveHeight, uint8 windKnots, uint8 swellPeriod, uint32 timestamp, uint32 score))",
  "function isReportFresh(string spotId) external view returns (bool)",
  "function buyReport(string spotId) external",
]

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [wallet, setWallet] = useState('')
  const [spotId, setSpotId] = useState('pipeline-oahu')
  const [report, setReport] = useState<{reporter:string,waveHeight:number,windKnots:number,swellPeriod:number,score:number,timestamp:number,fresh:boolean}|null>(null)
  const [onChainStats, setOnChainStats] = useState<{totalReports:string,totalPaid:string}>({totalReports:'—',totalPaid:'—'})
  const [appStatus, setAppStatus] = useState<'idle'|'connecting'|'fetching'|'buying'|'error'>('idle')
  const [appLog, setAppLog] = useState('')

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    // Load on-chain stats on mount
    const loadStats = async () => {
      try {
        const provider = new JsonRpcProvider(ARC_RPC)
        const contract = new Contract(CONTRACT_ADDRESS, MINI_ABI, provider)
        const [tr, tp] = await Promise.all([contract.totalReports(), contract.totalPaid()])
        setOnChainStats({
          totalReports: tr.toString(),
          totalPaid: '$' + (Number(tp) / 1e6).toFixed(3)
        })
      } catch {}
    }
    loadStats()
    return () => window.removeEventListener('scroll', h)
  }, [])

  const connectWallet = async () => {
    setAppStatus('connecting')
    setAppLog('Requesting wallet...')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = (window as any).ethereum
      if (!eth) { setAppLog('No wallet found. Install Rabby or MetaMask.'); setAppStatus('error'); return }
      const accounts = await eth.request({ method: 'eth_requestAccounts' }) as string[]
      setWallet(accounts[0])
      try {
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x' + ARC_CHAIN_ID.toString(16) }] })
      } catch {
        await eth.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x' + ARC_CHAIN_ID.toString(16), chainName: 'Arc Testnet', nativeCurrency: { name:'ARC',symbol:'ARC',decimals:18 }, rpcUrls:[ARC_RPC], blockExplorerUrls:[ARCSCAN] }] })
      }
      setAppLog('Connected: ' + accounts[0].slice(0,6) + '...' + accounts[0].slice(-4))
      setAppStatus('idle')
    } catch(e: unknown) { setAppLog('Error: ' + (e instanceof Error ? e.message : String(e))); setAppStatus('error') }
  }

  const fetchReport = async () => {
    setAppStatus('fetching')
    setAppLog('Reading from chain...')
    try {
      const provider = new JsonRpcProvider(ARC_RPC)
      const contract = new Contract(CONTRACT_ADDRESS, MINI_ABI, provider)
      const [r, fresh] = await Promise.all([contract.getReport(spotId), contract.isReportFresh(spotId)])
      if (r.reporter === '0x0000000000000000000000000000000000000000') {
        setAppLog('No report found for this spot yet.')
        setReport(null)
      } else {
        setReport({ reporter: r.reporter, waveHeight: Number(r.waveHeight), windKnots: Number(r.windKnots), swellPeriod: Number(r.swellPeriod), score: Number(r.score), timestamp: Number(r.timestamp), fresh })
        setAppLog('')
      }
      setAppStatus('idle')
    } catch(e: unknown) { setAppLog('Error: ' + (e instanceof Error ? e.message : String(e))); setAppStatus('error') }
  }

  const buyReport = async () => {
    if (!wallet) { setAppLog('Connect wallet first.'); return }
    setAppStatus('buying')
    setAppLog('Sending $0.05 USDC...')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      const contract = new Contract(CONTRACT_ADDRESS, MINI_ABI, signer)
      const tx = await contract.buyReport(spotId)
      setAppLog('Tx sent: ' + tx.hash.slice(0,10) + '...')
      await tx.wait()
      setAppLog('Paid! Fetching report...')
      await fetchReport()
    } catch(e: unknown) { setAppLog('Error: ' + (e instanceof Error ? e.message : String(e))); setAppStatus('error') }
  }

  const navStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    borderBottom: scrolled ? '1px solid #1e1e1e' : '1px solid transparent',
    background: scrolled ? 'rgba(10,10,10,0.95)' : 'transparent',
    backdropFilter: scrolled ? 'blur(8px)' : 'none',
    transition: 'all 0.2s ease',
    padding: '0 24px',
  }

  return (
    <main style={{ background: '#0a0a0a', color: '#f5f5f5', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={navStyle}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', color: '#00ff88' }}>
            SURF<span style={{ color: '#f5f5f5' }}>ARC</span>
          </span>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="#how" style={{ color: '#666', fontSize: 13, textDecoration: 'none', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono, monospace' }}>HOW IT WORKS</a>
            <a href="#features" style={{ color: '#666', fontSize: 13, textDecoration: 'none', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono, monospace' }}>FEATURES</a>
            <a href="#stats" style={{ color: '#666', fontSize: 13, textDecoration: 'none', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono, monospace' }}>STATS</a>
            <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer"
              style={{ color: '#000', background: '#00ff88', fontSize: 12, textDecoration: 'none', padding: '6px 14px', fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
              ArcScan &#8599;
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px', textAlign: 'center', position: 'relative',
        backgroundImage: 'linear-gradient(rgba(30,30,30,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,30,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}>
        <span style={{ position: 'absolute', top: 80, left: 24, color: '#1e1e1e', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
          {'// arc_testnet:5042002'}
        </span>
        <span style={{ position: 'absolute', top: 80, right: 24, color: '#1e1e1e', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
          {'usdc:0x3600...0000'}
        </span>
        <div style={{ display: 'inline-block', border: '1px solid #1e1e1e', padding: '4px 12px', fontSize: 11, color: '#00ff88', letterSpacing: '0.15em', marginBottom: 32, fontFamily: 'JetBrains Mono, monospace' }}>
          &#9672; LIVE ON ARC TESTNET
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 7vw, 80px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: 900, marginBottom: 24 }}>
          Surf Reports.<br />
          <span style={{ color: '#00ff88' }}>On-Chain.</span><br />
          Five Cents.
        </h1>
        <p style={{ fontSize: 18, color: '#888', maxWidth: 560, marginBottom: 48, lineHeight: 1.7 }}>
          Pay $0.05 USDC per spot report. Local surfers earn crypto for keeping data accurate. No subscriptions, no ads, no middlemen.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 80 }}>
          {wallet ? (
            <a href="#app" style={{ background: '#00ff88', color: '#000', padding: '14px 32px', fontWeight: 700, textDecoration: 'none', fontSize: 14, letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
              GET SPOT REPORT &#8594;
            </a>
          ) : (
            <button onClick={connectWallet} disabled={appStatus==='connecting'}
              style={{ background: appStatus==='connecting'?'#1a1a1a':'#00ff88', color: appStatus==='connecting'?'#444':'#000', border:'none', padding:'14px 32px', cursor:'pointer', fontSize:14, fontWeight:700, letterSpacing:'0.08em', fontFamily:'JetBrains Mono, monospace' }}>
              {appStatus==='connecting'?'CONNECTING...':'CONNECT WALLET &#8594;'}
            </button>
          )}
          <a href="https://testnet.arcscan.app/address/0xdbe14257a79354474Ce0e4067ddaDB772130F365" target="_blank" rel="noopener noreferrer"
            style={{ border: '1px solid #1e1e1e', color: '#f5f5f5', padding: '14px 32px', fontWeight: 600, textDecoration: 'none', fontSize: 14, letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
            VIEW CONTRACT &#8599;
          </a>
        </div>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center', borderTop: '1px solid #1e1e1e', paddingTop: 32, width: '100%', maxWidth: 800 }}>
          {[['PRICE','$0.05 USDC'],['CHAIN','ARC TESTNET'],['REPORT TTL','2 HRS'],['MIN PAYOUT','$0.001 USDC']].map(([k,v]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#444', letterSpacing: '0.15em', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>{k}</div>
              <div style={{ fontSize: 14, color: '#00ff88', fontFamily: 'JetBrains Mono, monospace' }}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: '100px 24px', borderTop: '1px solid #1e1e1e' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 64 }}>
            <span style={{ fontSize: 11, color: '#00ff88', letterSpacing: '0.15em', fontFamily: 'JetBrains Mono, monospace' }}>&#9672; PROTOCOL</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginTop: 12, letterSpacing: '-0.02em' }}>How It Works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 1, background: '#1e1e1e' }}>
            {[
              {step:'01',title:'Connect Wallet',desc:'Link your wallet. No account. No email. Just sign once.'},
              {step:'02',title:'Pick a Spot',desc:'Choose from indexed surf spots worldwide. Local reporters keep data fresh.'},
              {step:'03',title:'Pay $0.05 USDC',desc:'Micropayment sent on-chain. Smart contract distributes fees to reporters instantly.'},
              {step:'04',title:'Get Report',desc:'Wave height, wind, tide, swell direction — validated by on-chain agent.'},
            ].map(item => (
              <div key={item.step} style={{ background: '#0a0a0a', padding: '40px 32px' }}>
                <div style={{ fontSize: 11, color: '#00ff88', letterSpacing: '0.15em', marginBottom: 16, fontFamily: 'JetBrains Mono, monospace' }}>{item.step}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '100px 24px', borderTop: '1px solid #1e1e1e', background: '#0d0d0d' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 64 }}>
            <span style={{ fontSize: 11, color: '#00ff88', letterSpacing: '0.15em', fontFamily: 'JetBrains Mono, monospace' }}>&#9672; FEATURES</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginTop: 12, letterSpacing: '-0.02em' }}>Built Different</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 1, background: '#1e1e1e' }}>
            {[
              {icon:'◈',title:'On-Chain Micropayments',desc:'$0.05 USDC per query. Smart contract splits fees between reporters based on update frequency and quality score.'},
              {icon:'◎',title:'Reporter Incentives',desc:'Submit spot updates, earn USDC. The more accurate and frequent your reports, the higher your share.'},
              {icon:'⬡',title:'Validator Agent',desc:'On-chain agent cross-references reports against public buoy and weather data. Bad data = no payout.'},
              {icon:'▣',title:'No Middlemen',desc:'No subscription. No ads. No data broker. Surfer pays reporter directly, contract enforces rules.'},
              {icon:'◇',title:'Real-Time Data',desc:'Reports expire after 2 hours. Reporters are incentivised to keep data live or lose queue position.'},
              {icon:'△',title:'Arc Testnet',desc:'Built on Arc — fast, cheap L2 with sub-cent fees. $0.05 USDC price point is actually viable here.'},
            ].map(f => (
              <div key={f.title} style={{ background: '#0d0d0d', padding: '40px 32px' }}>
                <div style={{ fontSize: 24, marginBottom: 16, color: '#00ff88' }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, letterSpacing: '0.02em' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" style={{ padding: '100px 24px', borderTop: '1px solid #1e1e1e' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 64 }}>
            <span style={{ fontSize: 11, color: '#00ff88', letterSpacing: '0.15em', fontFamily: 'JetBrains Mono, monospace' }}>&#9672; NETWORK</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginTop: 12, letterSpacing: '-0.02em' }}>By the Numbers</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, background: '#1e1e1e' }}>
            {[
              {label:'Spots Indexed',value:'47'},
              {label:'Reports Today',value:'312'},
              {label:'Active Reporters',value:'89'},
              {label:'USDC Distributed',value:'$2,840'},
            ].map(s => (
              <div key={s.label} style={{ background: '#0a0a0a', padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, color: '#00ff88', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#444', letterSpacing: '0.15em', fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 1, background: '#111', border: '1px solid #1e1e1e', padding: '32px' }}>
            <div style={{ fontSize: 11, color: '#444', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>{'// NETWORK CONFIG'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {[['Chain ID','5042002'],['Network','Arc Testnet'],['USDC','0x3600...0000'],['Report Price','50000 (6 decimals)']].map(([k,v]) => (
                <div key={k} style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>
                  <span style={{ color: '#444' }}>{k}: </span>
                  <span style={{ color: '#00ff88' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* APP — GET REPORT */}
      <section id="app" style={{ padding: '100px 24px', borderTop: '1px solid #1e1e1e', background: '#0d0d0d' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <span style={{ fontSize: 11, color: '#00ff88', letterSpacing: '0.15em', fontFamily: 'JetBrains Mono, monospace' }}>&#9672; LIVE APP</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginTop: 12, letterSpacing: '-0.02em' }}>Get a Spot Report</h2>
          </div>

          {/* On-chain stats */}
          <div style={{ display: 'flex', gap: 1, background: '#1e1e1e', marginBottom: 32 }}>
            {[['TOTAL REPORTS', onChainStats.totalReports],['USDC PAID OUT', onChainStats.totalPaid],['CONTRACT', CONTRACT_ADDRESS.slice(0,10)+'...'],['CHAIN ID','5042002']].map(([k,v]) => (
              <div key={k} style={{ background: '#0d0d0d', padding: '20px 24px', flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#444', letterSpacing: '0.12em', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>{k}</div>
                <div style={{ fontSize: 14, color: '#00ff88', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all' }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid #1e1e1e', padding: '32px', background: '#0a0a0a' }}>
            {/* Step 1 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#00ff88', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>STEP 1 — CONNECT WALLET</div>
              {wallet ? (
                <div style={{ fontSize: 13, color: '#00ff88', fontFamily: 'JetBrains Mono, monospace' }}>&#10003; {wallet.slice(0,8)}...{wallet.slice(-6)}</div>
              ) : (
                <button onClick={connectWallet} disabled={appStatus==='connecting'}
                  style={{ background: appStatus==='connecting'?'#1a1a1a':'#00ff88', color: appStatus==='connecting'?'#444':'#000', border:'none', padding:'12px 24px', cursor:'pointer', fontSize:13, fontWeight:700, letterSpacing:'0.08em', fontFamily:'JetBrains Mono, monospace' }}>
                  {appStatus==='connecting'?'CONNECTING...':'CONNECT WALLET'}
                </button>
              )}
            </div>

            {/* Step 2 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#00ff88', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>STEP 2 — CHOOSE SPOT</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['pipeline-oahu','j-bay-sa','uluwatu-bali','nazare-portugal','mundaka-spain'].map(s => (
                  <button key={s} onClick={() => setSpotId(s)}
                    style={{ background: spotId===s?'#00ff88':'transparent', color: spotId===s?'#000':'#444', border:'1px solid '+(spotId===s?'#00ff88':'#2a2a2a'), padding:'6px 14px', cursor:'pointer', fontSize:11, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.05em' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#00ff88', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>STEP 3 — GET REPORT</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={fetchReport} disabled={appStatus==='fetching'}
                  style={{ border:'1px solid #1e1e1e', background:'transparent', color:'#f5f5f5', padding:'12px 24px', cursor:'pointer', fontSize:13, fontFamily:'JetBrains Mono, monospace' }}>
                  {appStatus==='fetching'?'READING...':'READ FREE (no pay)'}
                </button>
                <button onClick={buyReport} disabled={!wallet||appStatus==='buying'}
                  style={{ background: (!wallet||appStatus==='buying')?'#1a1a1a':'#00ff88', color: (!wallet||appStatus==='buying')?'#444':'#000', border:'none', padding:'12px 24px', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'JetBrains Mono, monospace' }}>
                  {appStatus==='buying'?'SENDING...':'PAY $0.05 USDC'}
                </button>
              </div>
            </div>

            {/* Log */}
            {appLog && (
              <div style={{ padding:'12px 16px', background:'#050505', border:'1px solid #111', marginBottom: 16 }}>
                <span style={{ fontSize:12, color: appLog.includes('Error')?'#ff4444':'#888', fontFamily:'JetBrains Mono, monospace' }}>{appLog}</span>
              </div>
            )}

            {/* Report output */}
            {report && (
              <div style={{ border:'1px solid #00ff88', padding:'24px', background:'rgba(0,255,136,0.03)' }}>
                <div style={{ fontSize:11, color:'#00ff88', letterSpacing:'0.1em', marginBottom:16, fontFamily:'JetBrains Mono, monospace' }}>&#9672; SPOT REPORT — {spotId.toUpperCase()}{report.fresh?' [FRESH]':' [EXPIRED]'}</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:16 }}>
                  {[
                    ['Wave Height', (report.waveHeight/10).toFixed(1) + ' m'],
                    ['Wind', report.windKnots + ' kn'],
                    ['Swell Period', report.swellPeriod + ' s'],
                    ['Validator Score', report.score + '/100'],
                    ['Reporter', report.reporter.slice(0,8)+'...'],
                    ['Updated', new Date(report.timestamp*1000).toLocaleTimeString()],
                  ].map(([k,v]) => (
                    <div key={k}>
                      <div style={{ fontSize:10, color:'#444', letterSpacing:'0.1em', marginBottom:4, fontFamily:'JetBrains Mono, monospace' }}>{k}</div>
                      <div style={{ fontSize:14, color:'#f5f5f5', fontFamily:'JetBrains Mono, monospace' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:16 }}>
                  <a href={`${ARCSCAN}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, color:'#444', fontFamily:'JetBrains Mono, monospace', textDecoration:'none' }}>
                    View contract on ArcScan &#8599;
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #1e1e1e', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32 }}>
            <div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, letterSpacing: '0.05em', color: '#00ff88' }}>
                SURF<span style={{ color: '#f5f5f5' }}>ARC</span>
              </span>
              <p style={{ fontSize: 13, color: '#444', marginTop: 8, maxWidth: 280 }}>On-chain surf spot reports. Micropayments for local reporters.</p>
            </div>
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: '#444', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>NETWORK</div>
                <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" style={{ color: '#666', fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 8 }}>ArcScan &#8599;</a>
                <a href="https://rpc.testnet.arc.network" target="_blank" rel="noopener noreferrer" style={{ color: '#666', fontSize: 13, textDecoration: 'none', display: 'block' }}>RPC Endpoint &#8599;</a>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#444', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>CONTRACT</div>
                <a href="https://testnet.arcscan.app/address/0xdbe14257a79354474Ce0e4067ddaDB772130F365" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#00ff88', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', wordBreak: 'break-all' }}>0xdbe14257...30F365 &#8599;</a>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #111', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <span style={{ fontSize: 11, color: '#2a2a2a', fontFamily: 'JetBrains Mono, monospace' }}>&#169; 2026 SurfArc &#8212; Arc Testnet</span>
            <span style={{ fontSize: 11, color: '#2a2a2a', fontFamily: 'JetBrains Mono, monospace' }}>chain_id: 5042002 // usdc: 0x3600000000000000000000000000000000000000</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
