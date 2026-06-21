'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers'
import TopoBackground from './TopoBackground'

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

// ── spot → cartographic coordinates (presentation only) ──
const SPOT_COORDS: Record<string, { lat: string; long: string; tag: string }> = {
  'pipeline-oahu':    { lat: '21.6647°N', long: '158.0533°W', tag: 'PAC' },
  'j-bay-sa':         { lat: '34.0507°S', long: '24.9281°E',  tag: 'IND' },
  'uluwatu-bali':     { lat: '08.8290°S', long: '115.0880°E', tag: 'IND' },
  'nazare-portugal':  { lat: '39.6010°N', long: '09.0700°W',  tag: 'ATL' },
  'mundaka-spain':    { lat: '43.4070°N', long: '02.6990°W',  tag: 'ATL' },
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [wallet, setWallet] = useState('')
  const [spotId, setSpotId] = useState('pipeline-oahu')
  const [report, setReport] = useState<{reporter:string,waveHeight:number,windKnots:number,swellPeriod:number,score:number,timestamp:number,fresh:boolean}|null>(null)
  const [onChainStats, setOnChainStats] = useState<{totalReports:string,totalPaid:string}>({totalReports:'—',totalPaid:'—'})
  const [appStatus, setAppStatus] = useState<'idle'|'connecting'|'fetching'|'buying'|'error'>('idle')
  const [appLog, setAppLog] = useState('')

  // ── presentation-only state (no chain logic) ──
  const [tick, setTick] = useState(0)               // pill values tick
  const [cross, setCross] = useState({ x: 50, y: 50 }) // crosshair tracks cursor (%)

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

  // presentation: pill values tick (decorative readout drift)
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const id = setInterval(() => setTick(t => (t + 1) % 1000), 1400)
    return () => clearInterval(id)
  }, [])

  // presentation: crosshair tracks the pointer over the hero
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setCross({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
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
    } catch(e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('0xe6e895f9') || msg.includes('InvalidSpot')) {
        setAppLog('No report for this spot yet. Submit one first!')
      } else if (msg.includes('0x69458111') || msg.includes('ReportExpired')) {
        setAppLog('Report expired (>2h old). Needs a fresh submission.')
      } else if (msg.includes('0x07a4ced1') || msg.includes('PaymentFailed')) {
        setAppLog('USDC payment failed. Approve USDC for contract first.')
      } else {
        setAppLog('Error: ' + msg.slice(0, 80))
      }
      setAppStatus('error')
    }
  }

  const submitTestReport = async () => {
    if (!wallet) { setAppLog('Connect wallet first.'); return }
    setAppStatus('buying')
    setAppLog('Submitting test report...')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      const submitABI = ["function submitReport(string spotId, string dataHash, uint8 waveHeight, uint8 windKnots, uint8 swellPeriod) external"]
      const contract = new Contract(CONTRACT_ADDRESS, submitABI, signer)
      // waveHeight in decimeters (15 = 1.5m), windKnots=12, swellPeriod=10
      const tx = await contract.submitReport(spotId, 'test-report-hash', 15, 12, 10)
      setAppLog('Tx sent: ' + tx.hash.slice(0,10) + '...')
      await tx.wait()
      setAppLog('Report submitted! Now try READ FREE.')
      setAppStatus('idle')
    } catch(e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setAppLog('Submit error: ' + msg.slice(0,80))
      setAppStatus('error')
    }
  }

  // ── derived presentation values (decorative) ──
  const coord = SPOT_COORDS[spotId] ?? SPOT_COORDS['pipeline-oahu']
  const swellTick = (3.4 + (Math.sin(tick / 2) + 1) * 1.3).toFixed(1)
  const scaleTick = 1000 + (tick % 7) * 250

  const logIsError = appLog.includes('Error') || appLog.includes('failed') || appLog.includes('error')
  const logIsGood = appLog.includes('submitted') || appLog.includes('Paid')

  return (
    <main className="grain" style={{ background: 'var(--ground)', color: 'var(--ink)', minHeight: '100vh', position: 'relative' }}>

      {/* ============ NAV ============ */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          borderBottom: scrolled ? '1px solid var(--hair)' : '1px solid transparent',
          background: scrolled ? 'rgba(7,9,10,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(8px)' : 'none',
          transition: 'all 0.25s ease',
          padding: '0 22px',
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/wave-logo.svg" alt="SurfArc" width={26} height={26} />
            <span className="font-mono" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--lime)' }}>
              SURF<span style={{ color: 'var(--ink)' }}>ARC</span>
            </span>
            <span className="pill" style={{ marginLeft: 8, borderColor: 'rgba(196,255,61,0.3)', color: 'var(--lime)' }}>
              <span className="anim-blink" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--lime)', display: 'inline-block' }} />
              LIVE
            </span>
          </span>
          <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
            {[['#how','HOW'],['#features','PROTOCOL'],['#stats','NETWORK'],['#app','READ']].map(([href,label]) => (
              <a key={href} href={href} className="font-mono" style={{ color: 'var(--ink-dim)', fontSize: 11, textDecoration: 'none', letterSpacing: '0.14em' }}>{label}</a>
            ))}
            <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" className="font-mono btn-lime"
              style={{ color: '#07090a', background: 'var(--lime)', fontSize: 11, textDecoration: 'none', padding: '7px 14px', fontWeight: 700, letterSpacing: '0.1em' }}>
              ARCSCAN &#8599;
            </a>
          </div>
        </div>
      </nav>

      {/* ============ HERO — the topographic map plate ============ */}
      <section
        style={{
          minHeight: '100vh', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '0',
        }}
      >
        <TopoBackground />

        {/* crosshair (tracks cursor) */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
          {/* faint full crosshair at center, pulsing */}
          <div className="anim-cross" style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(196,255,61,0.18)' }} />
          <div className="anim-cross" style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(196,255,61,0.18)' }} />
          {/* tracking reticle */}
          <div style={{
            position: 'absolute', left: `${cross.x}%`, top: `${cross.y}%`,
            width: 26, height: 26, marginLeft: -13, marginTop: -13,
            transition: 'left 0.18s ease-out, top 0.18s ease-out',
          }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,143,176,0.55)' }} />
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,143,176,0.55)' }} />
            <div style={{ position: 'absolute', inset: 6, border: '1px solid rgba(196,255,61,0.5)', borderRadius: '50%' }} />
          </div>
        </div>

        {/* TOP-LEFT pills: LAT / LONG / SWELL / SCALE */}
        <div style={{ position: 'relative', zIndex: 3, padding: '88px 24px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="pill" style={{ color: 'var(--lime)', borderColor: 'rgba(196,255,61,0.3)' }}>LAT&nbsp;<b style={{ color: 'var(--cream)', fontWeight: 600 }}>{coord.lat}</b></span>
          <span className="pill" style={{ color: 'var(--cream)' }}>LONG&nbsp;<b style={{ color: 'var(--cream)', fontWeight: 600 }}>{coord.long}</b></span>
          <span className="pill" style={{ color: 'var(--pink)', borderColor: 'rgba(255,143,176,0.3)' }}>SWELL&nbsp;<b style={{ color: 'var(--cream)', fontWeight: 600 }}>{swellTick}m</b></span>
          <span className="pill" style={{ color: 'var(--sky)' }}>SCALE&nbsp;<b style={{ color: 'var(--cream)', fontWeight: 600 }}>1:{scaleTick}</b></span>
          <span className="pill" style={{ color: 'var(--ink-dim)' }}>SECTOR&nbsp;<b style={{ color: 'var(--lime)', fontWeight: 600 }}>{coord.tag}</b></span>
        </div>

        {/* CENTER intro line (data-dense, techy) */}
        <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 24px' }}>
          <div className="anim-rise pill" style={{ borderColor: 'rgba(196,255,61,0.3)', color: 'var(--lime)', marginBottom: 22 }}>
            &#9672; ON-CHAIN SURF CARTOGRAPHY &mdash; ARC TESTNET
          </div>
          <p className="font-mono anim-rise" style={{ maxWidth: 520, margin: '0 auto', fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.9, letterSpacing: '0.02em' }}>
            Pay $0.05 USDC to read a verified spot report &mdash; wave, wind, swell, tide.
            Fees split among local reporters. No subscriptions, no ads, no middlemen.
          </p>
        </div>

        {/* BOTTOM band: huge lime wordmark (left) + serif/mono caption (right) */}
        <div
          style={{
            position: 'relative', zIndex: 3, padding: '0 24px 40px',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap',
          }}
        >
          {/* huge blocky display wordmark */}
          <div className="anim-rise" style={{ lineHeight: 0.84 }}>
            <h1 className="font-display" style={{
              fontWeight: 900, fontSize: 'clamp(56px, 13vw, 176px)', letterSpacing: '-0.04em',
              color: 'var(--lime)', textTransform: 'uppercase', margin: 0,
              textShadow: '0 0 60px rgba(196,255,61,0.18)',
            }}>
              SURF<br />ARC
            </h1>
            <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
              {wallet ? (
                <a href="#app" className="font-mono btn-lime" style={{ background: 'var(--lime)', color: '#07090a', padding: '13px 26px', fontWeight: 700, textDecoration: 'none', fontSize: 12, letterSpacing: '0.1em' }}>
                  GET SPOT REPORT &#8594;
                </a>
              ) : (
                <button onClick={connectWallet} disabled={appStatus==='connecting'} className="font-mono btn-lime"
                  style={{ background: appStatus==='connecting'?'var(--ground-2)':'var(--lime)', color: appStatus==='connecting'?'var(--ink-dim)':'#07090a', border:'none', padding:'13px 26px', cursor:'pointer', fontSize:12, fontWeight:700, letterSpacing:'0.1em' }}>
                  {appStatus==='connecting'?'CONNECTING…':'CONNECT WALLET →'}
                </button>
              )}
              <a href="#app" className="font-mono" style={{ border: '1px solid var(--hair)', color: 'var(--ink)', padding: '13px 26px', fontWeight: 600, textDecoration: 'none', fontSize: 12, letterSpacing: '0.1em' }}>
                READ FREE
              </a>
            </div>
          </div>

          {/* bottom-right: italic-serif line + small mono paragraph */}
          <div style={{ maxWidth: 320, textAlign: 'right' }}>
            <p className="font-serif" style={{ fontStyle: 'italic', fontSize: 20, lineHeight: 1.35, color: 'var(--cream)' }}>
              &ldquo;Every swell, charted on-chain &mdash; the map pays the cartographer.&rdquo;
            </p>
            <p className="font-mono" style={{ marginTop: 14, fontSize: 11, color: 'var(--ink-dim)', lineHeight: 1.8, letterSpacing: '0.03em' }}>
              {'// chain_id 5042002 · usdc 0x3600…0000'}<br />
              {'// report_ttl 2h · price 50000 (6dp)'}<br />
              {'// reporters earn per query · validator score 0–100'}
            </p>
          </div>
        </div>
      </section>

      {/* ============ HERO STATS STRIP ============ */}
      <section style={{ borderTop: '1px solid var(--hair)', borderBottom: '1px solid var(--hair)', background: 'var(--ground-2)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {[['PRICE','$0.05 USDC'],['CHAIN','ARC TESTNET'],['REPORT TTL','2 HRS'],['MIN PAYOUT','$0.001 USDC']].map(([k,v], i) => (
            <div key={k} style={{ padding: '22px 24px', borderLeft: i === 0 ? 'none' : '1px solid var(--hair)' }}>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.15em', marginBottom: 6 }}>{k}</div>
              <div className="font-mono" style={{ fontSize: 15, color: 'var(--lime)' }}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" style={{ padding: '96px 24px', position: 'relative' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <SectionHead tag="PROTOCOL" title="How It Works" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 1, background: 'var(--hair)' }}>
            {[
              {step:'01',title:'Connect Wallet',desc:'Link your wallet. No account. No email. Just sign once.'},
              {step:'02',title:'Pick a Spot',desc:'Choose from indexed surf spots worldwide. Local reporters keep data fresh.'},
              {step:'03',title:'Pay $0.05 USDC',desc:'Micropayment sent on-chain. Smart contract distributes fees to reporters instantly.'},
              {step:'04',title:'Get Report',desc:'Wave height, wind, tide, swell direction — validated by on-chain agent.'},
            ].map(item => (
              <div key={item.step} className="card-lift" style={{ background: 'var(--ground)', padding: '36px 30px' }}>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--lime)', letterSpacing: '0.18em', marginBottom: 16 }}>◇ {item.step}</div>
                <h3 className="font-display" style={{ fontSize: 19, fontWeight: 700, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--ink-dim)', lineHeight: 1.75 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" style={{ padding: '96px 24px', borderTop: '1px solid var(--hair)', background: 'var(--ground-2)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <SectionHead tag="FEATURES" title="Built Different" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 1, background: 'var(--hair)' }}>
            {[
              {icon:'◈',title:'On-Chain Micropayments',desc:'$0.05 USDC per query. Smart contract splits fees between reporters based on update frequency and quality score.'},
              {icon:'◎',title:'Reporter Incentives',desc:'Submit spot updates, earn USDC. The more accurate and frequent your reports, the higher your share.'},
              {icon:'⬡',title:'Validator Score',desc:'An owner/curator-set validator score cross-references reports against public buoy and weather data. Bad data = no payout.'},
              {icon:'▣',title:'No Middlemen',desc:'No subscription. No ads. No data broker. Surfer pays reporter directly, contract enforces rules.'},
              {icon:'◇',title:'Real-Time Data',desc:'Reports expire after 2 hours. Reporters are incentivised to keep data live or lose queue position.'},
              {icon:'△',title:'Arc Testnet',desc:'Built on Arc — fast, cheap L2 with sub-cent fees. $0.05 USDC price point is actually viable here.'},
            ].map(f => (
              <div key={f.title} className="card-lift" style={{ background: 'var(--ground-2)', padding: '36px 30px' }}>
                <div style={{ fontSize: 22, marginBottom: 16, color: 'var(--lime)' }}>{f.icon}</div>
                <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, letterSpacing: '0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--ink-dim)', lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section id="stats" style={{ padding: '96px 24px', borderTop: '1px solid var(--hair)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <SectionHead tag="NETWORK" title="By the Numbers" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, background: 'var(--hair)' }}>
            {[
              {label:'Spots Indexed',value:'47'},
              {label:'Reports Today',value:'312'},
              {label:'Active Reporters',value:'89'},
              {label:'USDC Distributed',value:'$2,840'},
            ].map(s => (
              <div key={s.label} className="card-lift" style={{ background: 'var(--ground)', padding: '44px 30px', textAlign: 'center' }}>
                <div className="font-display" style={{ fontSize: 'clamp(34px, 4vw, 52px)', fontWeight: 800, color: 'var(--lime)', marginBottom: 8 }}>{s.value}</div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.15em' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 1, background: 'var(--panel)', border: '1px solid var(--hair)', padding: '30px' }}>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.1em', marginBottom: 14 }}>{'// NETWORK CONFIG'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {[['Chain ID','5042002'],['Network','Arc Testnet'],['USDC','0x3600...0000'],['Report Price','50000 (6 decimals)']].map(([k,v]) => (
                <div key={k} className="font-mono" style={{ fontSize: 13 }}>
                  <span style={{ color: 'var(--ink-faint)' }}>{k}: </span>
                  <span style={{ color: 'var(--lime)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ APP — GET REPORT (the cartographic console) ============ */}
      <section id="app" style={{ padding: '96px 24px', borderTop: '1px solid var(--hair)', background: 'var(--ground-2)' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <SectionHead tag="LIVE APP" title="Read a Spot Report" />

          {/* On-chain stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1, background: 'var(--hair)', marginBottom: 28 }}>
            {[['TOTAL REPORTS', onChainStats.totalReports],['USDC PAID OUT', onChainStats.totalPaid],['CONTRACT', CONTRACT_ADDRESS.slice(0,10)+'...'],['CHAIN ID','5042002']].map(([k,v]) => (
              <div key={k} style={{ background: 'var(--ground)', padding: '18px 20px', textAlign: 'center' }}>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.12em', marginBottom: 6 }}>{k}</div>
                <div className="font-mono" style={{ fontSize: 13.5, color: 'var(--lime)', wordBreak: 'break-all' }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid var(--hair)', padding: '30px', background: 'var(--ground)', position: 'relative' }}>
            {/* corner ticks for a console feel */}
            <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

            {/* Step 1 */}
            <div style={{ marginBottom: 24 }}>
              <StepLabel n="01" text="CONNECT WALLET" />
              {wallet ? (
                <div className="font-mono" style={{ fontSize: 13, color: 'var(--lime)' }}>✓ {wallet.slice(0,8)}...{wallet.slice(-6)}</div>
              ) : (
                <button onClick={connectWallet} disabled={appStatus==='connecting'} className="font-mono btn-lime"
                  style={{ background: appStatus==='connecting'?'var(--ground-2)':'var(--lime)', color: appStatus==='connecting'?'var(--ink-dim)':'#07090a', border:'none', padding:'11px 22px', cursor:'pointer', fontSize:12, fontWeight:700, letterSpacing:'0.1em' }}>
                  {appStatus==='connecting'?'CONNECTING…':'CONNECT WALLET'}
                </button>
              )}
            </div>

            {/* Step 2 */}
            <div style={{ marginBottom: 24 }}>
              <StepLabel n="02" text="CHOOSE SPOT" />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['pipeline-oahu','j-bay-sa','uluwatu-bali','nazare-portugal','mundaka-spain'].map(s => (
                  <button key={s} onClick={() => setSpotId(s)} className="font-mono"
                    style={{ background: spotId===s?'var(--lime)':'transparent', color: spotId===s?'#07090a':'var(--ink-dim)', border:'1px solid '+(spotId===s?'var(--lime)':'var(--hair)'), padding:'6px 13px', cursor:'pointer', fontSize:11, letterSpacing:'0.04em', transition:'all .2s ease' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ marginBottom: 24 }}>
              <StepLabel n="03" text="READ / PAY" />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={fetchReport} disabled={appStatus==='fetching'} className="font-mono"
                  style={{ border:'1px solid var(--hair)', background:'transparent', color:'var(--ink)', padding:'11px 22px', cursor:'pointer', fontSize:12, letterSpacing:'0.06em' }}>
                  {appStatus==='fetching'?'READING…':'READ FREE'}
                </button>
                <button onClick={buyReport} disabled={!wallet||appStatus==='buying'} className="font-mono btn-lime"
                  style={{ background: (!wallet||appStatus==='buying')?'var(--ground-2)':'var(--lime)', color: (!wallet||appStatus==='buying')?'var(--ink-dim)':'#07090a', border:'none', padding:'11px 22px', cursor:'pointer', fontSize:12, fontWeight:700, letterSpacing:'0.06em' }}>
                  {appStatus==='buying'?'SENDING…':'PAY $0.05 USDC'}
                </button>
                <button onClick={submitTestReport} disabled={!wallet||appStatus==='buying'} className="font-mono"
                  style={{ border:'1px solid var(--hair)', background:'transparent', color:'var(--ink-faint)', padding:'11px 22px', cursor: (!wallet)?'not-allowed':'pointer', fontSize:11, letterSpacing:'0.04em' }}>
                  SUBMIT TEST REPORT
                </button>
              </div>
            </div>

            {/* Log */}
            {appLog && (
              <div style={{ padding:'12px 16px', background:'var(--ground-2)', borderLeft:'2px solid '+(logIsError?'#ff5a5a':logIsGood?'var(--lime)':'var(--hair)'), marginBottom: 16 }}>
                <span className="font-mono" style={{ fontSize:12, color: logIsError?'#ff7a7a': logIsGood?'var(--lime)':'var(--ink-dim)' }}>{appLog}</span>
              </div>
            )}
            {!appLog && !report && (
              <div style={{ padding:'12px 16px', background:'var(--ground-2)', borderLeft:'2px solid var(--hair)', marginBottom: 16 }}>
                <span className="font-mono" style={{ fontSize:11, color:'var(--ink-faint)' }}>{'// No reports in contract yet. Hit SUBMIT TEST REPORT to seed one, then READ FREE.'}</span>
              </div>
            )}

            {/* Report output */}
            {report && (
              <div style={{ border:'1px solid rgba(196,255,61,0.4)', padding:'24px', background:'rgba(196,255,61,0.03)', position:'relative' }}>
                <div className="font-mono" style={{ fontSize:11, color:'var(--lime)', letterSpacing:'0.1em', marginBottom:16 }}>
                  &#9672; SPOT REPORT — {spotId.toUpperCase()}
                  <span style={{ color: report.fresh ? 'var(--lime)' : 'var(--pink)' }}>{report.fresh?' [FRESH]':' [EXPIRED]'}</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:16 }}>
                  {[
                    ['Wave Height', (report.waveHeight/10).toFixed(1) + ' m'],
                    ['Wind', report.windKnots + ' kn'],
                    ['Swell Period', report.swellPeriod + ' s'],
                    ['Validator Score', report.score + '/100'],
                    ['Reporter', report.reporter.slice(0,8)+'...'],
                    ['Updated', new Date(report.timestamp*1000).toLocaleTimeString()],
                  ].map(([k,v]) => (
                    <div key={k}>
                      <div className="font-mono" style={{ fontSize:10, color:'var(--ink-faint)', letterSpacing:'0.1em', marginBottom:4 }}>{k}</div>
                      <div className="font-mono" style={{ fontSize:15, color:'var(--cream)' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:16 }}>
                  <a href={`${ARCSCAN}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="font-mono"
                    style={{ fontSize:11, color:'var(--ink-faint)', textDecoration:'none' }}>
                    View contract on ArcScan &#8599;
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: '1px solid var(--hair)', padding: '46px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32 }}>
            <div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Image src="/wave-logo.svg" alt="SurfArc" width={30} height={30} />
                <span className="font-mono" style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--lime)' }}>
                  SURF<span style={{ color: 'var(--ink)' }}>ARC</span>
                </span>
              </span>
              <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 10, maxWidth: 300 }}>
                On-chain surf cartography. Pay a few cents to read a spot — reporters get paid, the map stays honest.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 44, flexWrap: 'wrap' }}>
              <div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.1em', marginBottom: 12 }}>NETWORK</div>
                <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-dim)', fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 8 }}>ArcScan &#8599;</a>
                <a href="https://rpc.testnet.arc.network" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-dim)', fontSize: 13, textDecoration: 'none', display: 'block' }}>RPC Endpoint &#8599;</a>
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.1em', marginBottom: 12 }}>CONTRACT</div>
                <a href="https://testnet.arcscan.app/address/0xdbe14257a79354474Ce0e4067ddaDB772130F365" target="_blank" rel="noopener noreferrer" className="font-mono" style={{ fontSize: 12, color: 'var(--lime)', textDecoration: 'none', wordBreak: 'break-all' }}>0xdbe14257...30F365 &#8599;</a>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 40, paddingTop: 22, borderTop: '1px solid var(--hair)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>&#169; 2026 SurfArc &#8212; Arc Testnet</span>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>chain_id: 5042002 // usdc: 0x3600000000000000000000000000000000000000</span>
          </div>
        </div>
      </footer>
    </main>
  )
}

/* ── small presentational helpers ── */
function SectionHead({ tag, title }: { tag: string; title: string }) {
  return (
    <div style={{ marginBottom: 56 }}>
      <span className="font-mono" style={{ fontSize: 11, color: 'var(--lime)', letterSpacing: '0.18em' }}>&#9672; {tag}</span>
      <h2 className="font-display" style={{ fontSize: 'clamp(30px, 4.4vw, 50px)', fontWeight: 800, marginTop: 12, letterSpacing: '-0.025em', textTransform: 'uppercase' }}>{title}</h2>
    </div>
  )
}

function StepLabel({ n, text }: { n: string; text: string }) {
  return (
    <div className="font-mono" style={{ fontSize: 11, color: 'var(--lime)', letterSpacing: '0.12em', marginBottom: 12 }}>
      <span style={{ color: 'var(--ink-faint)' }}>STEP {n}</span> — {text}
    </div>
  )
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const base: React.CSSProperties = { position: 'absolute', width: 10, height: 10, borderColor: 'rgba(196,255,61,0.5)', pointerEvents: 'none' }
  const map: Record<string, React.CSSProperties> = {
    tl: { top: -1, left: -1, borderTop: '1px solid', borderLeft: '1px solid' },
    tr: { top: -1, right: -1, borderTop: '1px solid', borderRight: '1px solid' },
    bl: { bottom: -1, left: -1, borderBottom: '1px solid', borderLeft: '1px solid' },
    br: { bottom: -1, right: -1, borderBottom: '1px solid', borderRight: '1px solid' },
  }
  return <span aria-hidden style={{ ...base, ...map[pos] }} />
}
