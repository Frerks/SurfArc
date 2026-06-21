import type { Metadata } from 'next'
import { Archivo, Anonymous_Pro, Newsreader } from 'next/font/google'
import './globals.css'

// Blocky display grotesque for the huge cartographic wordmark + headings
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

// Data-dense mono: contour text, pills, coordinates, paragraphs
const anonymousPro = Anonymous_Pro({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

// Italic serif accent line (bottom-right cartographic caption)
const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['italic', 'normal'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SurfArc — On-Chain Surf Reports',
  description: 'Pay $0.05 USDC per real-time surf spot report. Micropayments distributed to local reporters on Arc Testnet.',
  keywords: 'surf, waves, blockchain, USDC, micropayments, spot report',
  openGraph: {
    title: 'SurfArc — On-Chain Surf Reports',
    description: 'Real-time surf conditions. $0.05 USDC per report. Reporters earn crypto.',
    type: 'website',
  },
  icons: {
    icon: '/wave-logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${archivo.variable} ${anonymousPro.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  )
}
