# SurfArc

```
=== COASTAL CONDITIONS BULLETIN ============================
ISSUED        on demand · ARC TESTNET STATION · CHAIN 5042002
VALID FOR     2 hours from last submit, then void
TARIFF        $0.05 USDC to pull one spot, paid out the same block
BREAKS LOGGED pipeline-oahu · j-bay-sa · uluwatu-bali
              nazare-portugal · mundaka-spain
============================================================
```

A swell call is a perishable good. Two hours after someone walks down and counts the sets,
the read is worthless — tide turned, wind backed round, window closed. SurfArc is the
smallest possible market for that perishable thing: a surfer pays a nickel in USDC to see
what a named break is doing *right now*, and the nickel lands in the wallet of whoever
logged the conditions. The local who actually checked, paid by anyone an hour inland
deciding whether to drive. SurfArc is the wire between them, and nothing else sits on it.

---

## Forecast

Surf intel is trapped in group chats and the head of the one regular who always knows. It is
hyperlocal, it decays in hours, and there has never been a clean way to pay the person
holding it the small amount the read is worth. A monthly forecast app is the wrong
instrument — you do not want a subscription to the whole ocean, you want this break, this
morning.

So each break becomes a one-slot on-chain feed. A reporter writes the latest conditions in;
a reader pays a flat five cents to pull whatever is in the slot, and only if it is still
fresh. The contract clears the fare and pays the reporter in the same transaction — no
queue, no invoice, no settlement lag. A read carries `waveHeight` (uint8 decimetres, 15 =>
1.5 m face), `windKnots`, `swellPeriod` in seconds, a `score`, a `timestamp`, a `dataHash`
(IPFS pointer or short descriptor) and the reporter address. On the station, `READ FREE`
renders the current slot; `PAY $0.05 USDC` is the transaction that settles.

---

## How a report is bought

One call carries the whole exchange. `buyReport(spotId)` walks four checks in order:

1. **Is there a read?** No record in `latestReport[spotId]` → revert `InvalidSpot`.
2. **Is it still live?** Older than `REPORT_TTL` (2 hours) → revert `ReportExpired`. You
   cannot buy a stale call; the clock is enforced in the buy path itself.
3. **Take the fare.** `transferFrom` pulls exactly `REPORT_PRICE` — `50_000` units, which
   at six decimals is five cents — from the reader. If the pull fails (no approval, no
   balance) → revert `PaymentFailed`. Approve USDC for the contract before you buy.
4. **Pay the reporter, log it.** Emit `ReportPurchased` and `ReporterPaid`.

Reporters fill the slot with
`submitReport(spotId, dataHash, waveHeight, windKnots, swellPeriod)`. The first submit for
a never-seen break pushes the sender into `spotReporters[spotId]`, the running roster of
everyone who has ever logged that break. Every submit overwrites the slot, refreshes the
timestamp, and stamps a starting `score` of 80. The live station has a
`SUBMIT TEST REPORT` button that writes a sample read (1.5 m / 12 kn / 10 s) so you can run
the buy-and-read loop end to end on an empty break.

---

## Who gets paid

Of every five-cent fare, **eighty percent goes to the reporter** — `(REPORT_PRICE * 80) / 100`,
four cents — wired out inside `buyReport` and tallied into that wallet's `ReporterStats`
(`totalReports`, `totalEarned`, `lastReport`). The remaining twenty percent stays in the
contract; the owner clears it later with `withdrawFees(to)`.

Straight talk on the split. The *aim* is a break funded by the handful of regulars who keep
it current, and the contract already keeps the full `spotReporters[spotId]` roster for that.
But in this build the four cents go to the **single most recent reporter** — the author of
the exact read you are buying — not yet carved across the roster. `MIN_REPORTER_SHARE`
(`1_000` units, a tenth of a cent) is the floor reserved for that future per-contributor
carve. Today: one read, one author, one payout. The shared pool is charted, not yet wired.

---

## Validation

Every read carries a `score` from 0 to 100. A fresh `submitReport` stamps 80 by default.
The number can be revised by `updateScore(spotId, score)` — and that function is guarded by
`onlyOwner`, reverting `NotOwner` for anyone else. So call it what it is: a **curator-set
quality stamp**, turned by hand. There is no autonomous agent crawling buoy feeds, no
off-chain grader scoring reads behind the curtain. The station owner sets the dial; the dial
signals trust. (The marketing copy on the site calls it a "validator agent" — that is the
ambition. Cross-referencing public buoy and weather data is the obvious next build. For now
the number is set by a person.)

The genuinely trustless half of quality control is `isReportFresh(spotId)`: it returns false
the instant a read crosses its two-hour line, and `buyReport` enforces the identical cutoff.
Nobody can sell you yesterday's swell, owner included.

---

## Conditions

The fine print on the station — the contract details, in coastal terms.

```
SOURCE        SurfArc.sol · Solidity ^0.8.20 · MIT
DEPLOYED AT   0xdbe14257a79354474Ce0e4067ddaDB772130F365
WATERS        Arc testnet · chain 5042002
SOURCE STATE  bytecode live on-chain; Solidity NOT verified/published on ArcScan
USDC          0x3600000000000000000000000000000000000000 · 6 decimals
FARE          REPORT_PRICE = 50_000 units ($0.05)
WINDOW        REPORT_TTL = 2 hours
FLOOR         MIN_REPORTER_SHARE = 1_000 units ($0.001)
CARVE         80% reporter / 20% protocol (owner sweeps)
CHART AT      https://testnet.arcscan.app/address/0xdbe14257a79354474Ce0e4067ddaDB772130F365
STATION       https://surf-arc.vercel.app/
```

Read the contract through its ABI, not a verified-source tab: the address above is live and
the bytecode is on-chain, but the Solidity has **not** been verified or published on ArcScan.

Calls worth knowing:

- `submitReport(spotId, dataHash, waveHeight, windKnots, swellPeriod)` — log a read
- `buyReport(spotId)` — pay $0.05, pull the live read, pay its author
- `getReport(spotId)` → the full `Report` struct
- `isReportFresh(spotId)` → bool, false past +2h
- `updateScore(spotId, score)` — owner-only quality stamp (`uint32`)
- `withdrawFees(to)` — owner sweeps the 20% remainder

Events: `ReportSubmitted` · `ReportPurchased` · `ReporterPaid`.
Reverts: `InvalidSpot` · `ReportExpired` · `PaymentFailed` · `NotOwner`.

---

## Why the tide only comes in on Arc

Do the arithmetic on the unit, because the unit is the whole argument. The product is a
five-cent read, and the *point* of it is that the five cents fans out to the few locals who
keep a break current — so the real movement is not a nickel but tenths of a cent, several
recipients, every single purchase. That economics dies on any rail where touching a cent
costs more than a cent: the fee eats the read before the reporter sees a fraction of it, and
the floor (`MIN_REPORTER_SHARE`, a tenth of a cent) becomes a fantasy. A micro-subscription
sliced across contributors is viable only where moving sub-cent USDC is so close to
weightless that splitting a nickel five ways is beneath notice. Arc settles natively in
six-decimal USDC at fees that simply do not register against a `50_000`-unit transfer — which
is the one environment where this math survives contact with the water. The split-the-nickel
model is not a feature bolted onto SurfArc; it is the only shape the numbers permit, and Arc
is what lets the numbers exist.

---

## Standing up a station

```
git clone https://github.com/Frerks/SurfArc.git
cd SurfArc
npm install
npm run dev
```

Open the dev server, connect Rabby or MetaMask, let it add Arc testnet (chain 5042002, RPC
`https://rpc.testnet.arc.network`). Reads are free; a buy needs a little testnet USDC and one
approval. Empty break? Hit `SUBMIT TEST REPORT` to seed a read, then pull it back.

Frontend is Next.js with ethers v6 calling the contract over the Arc RPC directly. Built and
deployed by Leon Frerks.

```
=== END BULLETIN · NEXT ISSUE ON NEXT SUBMIT · MIND THE 2-HOUR WINDOW ===
```
