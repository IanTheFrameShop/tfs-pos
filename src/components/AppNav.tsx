'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AppNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-900">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-white">
          TFS POS
        </Link>
        <div className="flex gap-6">
          <Link
            href="/orders"
            className={`transition-colors ${
              isActive('/orders')
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Work Orders
          </Link>
          <Link
            href="/customers"
            className={`transition-colors ${
              isActive('/customers')
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Customers
          </Link>
          <Link
            href="/admin"
            className={`transition-colors ${
              isActive('/admin')
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}
