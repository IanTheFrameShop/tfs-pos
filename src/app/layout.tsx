import type { Metadata } from 'next'
import { AppNav } from '@/components/AppNav'
import './globals.css'

export const metadata: Metadata = {
  title: 'TFS POS',
  description: 'The Frame Shop Point of Sale System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white">
        <AppNav />
        {children}
      </body>
    </html>
  )
}
