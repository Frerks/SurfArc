import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SurfArc — On-Chain Surf Reports',
  description: 'Pay $0.05 USDC per real-time surf spot report. Micropayments distributed to local reporters on Arc Testnet.',
  keywords: 'surf, waves, blockchain, USDC, micropayments, spot report',
  openGraph: {
    title: 'SurfArc — On-Chain Surf Reports',
    description: 'Real-time surf conditions. $0.05 USDC per report. Reporters earn crypto.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
