'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

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
        padding: '80px 24px 60px', textAlign: 'center', position: 'relative',
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
          <a href="#how" style={{ background: '#00ff88', color: '#000', padding: '14px 32px', fontWeight: 700, textDecoration: 'none', fontSize: 14, letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
            HOW IT WORKS &#8594;
          </a>
          <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer"
            style={{ border: '1px solid #1e1e1e', color: '#f5f5f5', padding: '14px 32px', fontWeight: 600, textDecoration: 'none', fontSize: 14, letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
            VIEW ON ARCSCAN &#8599;
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
