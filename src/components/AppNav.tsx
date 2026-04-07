'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AppNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const navLinks = [
    { href: '/orders', label: 'Work Orders' },
    { href: '/customers', label: 'Customers' },
    { href: '/admin', label: 'Admin' },
  ]

  return (
    <nav className="bg-white border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-tight">TFS</span>
          </div>
          <span className="text-sm font-semibold text-gray-800 tracking-tight">
            The Frame Shop
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium ${
                isActive(link.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
