import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'S K Borewells – Professional Borewell Services',
  description: 'Book certified borewell drilling services in Udupi, Karnataka. Residential, commercial & agricultural borewells. Get an instant quote, track your booking, and manage everything online.',
  keywords: ['borewell', 'borewell drilling', 'Udupi borewell', 'Karnataka borewell', 'S K Borewells', 'borewell booking'],
  openGraph: {
    title: 'S K Borewells – Professional Borewell Services',
    description: 'Book certified borewell drilling in Udupi, Karnataka. Instant quotes · Online booking · Real-time tracking.',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary',
    title: 'S K Borewells',
    description: 'Certified borewell drilling in Udupi, Karnataka.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
