# 🌊 SurfArc

**On-chain surf spot reports. $0.05 USDC per query. Reporters earn crypto.**

Live: [surf-arc.vercel.app](https://surf-arc.vercel.app) · Contract: [0xdbe142...](https://testnet.arcscan.app/address/0xdbe14257a79354474Ce0e4067ddaDB772130F365) · Arc Testnet (Chain ID: 5042002)

---

## Why Arc?

Local surf spot data lives in WhatsApp groups. No API, no structure, no incentive to keep it fresh. SurfArc fixes that with a dead-simple micropayment loop:

- **Surfer** pays $0.05 USDC → gets wave/wind/tide report
- **Reporter** (local surfer) earns 80% of every query for their spot
- **Validator agent** scores report quality — low quality = no payout

Arc makes this viable. Sub-cent gas fees mean a $0.05 payment actually makes economic sense. On Ethereum mainnet, gas would eat the entire payment. Here it's a rounding error.

## Why This Matters

The model is replicable to anything hyperlocal with perishable data:

- Traffic conditions → reporters earn per accurate update
- Air quality readings → sensor operators paid per query
- Fishing reports → boat captains monetize local knowledge
- Trail conditions → hikers share and earn

SurfArc is the proof of concept. Arc is the infrastructure that makes micropayment data markets real.

## Architecture

```
User (browser)
  │
  ├─ JsonRpcProvider (read free) ──────► Arc Testnet RPC
  │
  └─ BrowserProvider (write) ──────────► Wallet (Rabby/MetaMask)
                                              │
                                         SurfArc.sol
                                         0xdbe14257...
                                              │
                                    ┌─────────┴─────────┐
                               Reporter pays         Reporter earns
                               REPORT_PRICE          80% of fees
                               (50,000 USDC units)
```

## Contract

**Address:** `0xdbe14257a79354474Ce0e4067ddaDB772130F365`  
**Network:** Arc Testnet  
**Compiler:** solc 0.8.35, optimizer 200 runs  
**USDC:** `0x3600000000000000000000000000000000000000` (6 decimals)

Key functions:
- `submitReport(spotId, dataHash, waveHeight, windKnots, swellPeriod)` — reporter updates spot
- `buyReport(spotId)` — surfer pays $0.05 USDC, reporter gets $0.04
- `isReportFresh(spotId)` — returns false after 2 hours (stale data)
- `updateScore(spotId, score)` — validator sets quality score 0-100

## Stack

- **Frontend:** Next.js 15, App Router, TypeScript, Tailwind CSS
- **Web3:** ethers.js v6 (no wagmi, no viem)
- **Contract:** Solidity 0.8.35
- **Chain:** Arc Testnet (EVM-compatible L2)
- **Deploy:** Vercel

## Run Locally

```bash
git clone https://github.com/Frerks/SurfArc.git
cd SurfArc
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000). Connect Rabby or MetaMask, add Arc Testnet (Chain ID: 5042002, RPC: https://rpc.testnet.arc.network).

---

Built by a Java/Docker backend dev who surfs. The WhatsApp group problem is real.
