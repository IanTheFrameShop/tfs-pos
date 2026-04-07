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
    <aside className="w-52 shrink-0 bg-white border-r border-gray-200/80">
      <div className="px-3 py-5">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Admin
        </p>
        <nav className="space-y-0.5">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 text-[13px] font-medium ${
                isActive(link.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
