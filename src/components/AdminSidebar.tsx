'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/markup-tiers', label: 'Markup Tiers' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/glazing', label: 'Glazing' },
  { href: '/admin/matboards', label: 'Matboards' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/mouldings', label: 'Mouldings' },
  { href: '/admin/settings', label: 'Settings' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-56 border-r border-gray-800 bg-gray-900">
      <div className="p-6">
        <nav className="space-y-2">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded px-4 py-2 transition-colors ${
                isActive(link.href)
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}
