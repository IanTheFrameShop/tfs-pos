import Link from 'next/link'

const sections = [
  {
    title: 'Markup Tiers',
    description: 'Manage pricing tiers and markup multipliers',
    href: '/admin/markup-tiers',
  },
  {
    title: 'Services & Fitting',
    description: 'Configure service offerings and fitting options',
    href: '/admin/services',
  },
  {
    title: 'Glazing Types',
    description: 'Manage glazing options and specifications',
    href: '/admin/glazing',
  },
  {
    title: 'Matboards',
    description: 'Browse and manage matboard catalog',
    href: '/admin/matboards',
  },
  {
    title: 'Customer Categories',
    description: 'Set up customer segments and discount tiers',
    href: '/admin/categories',
  },
  {
    title: 'Mouldings',
    description: 'Browse moulding inventory and costs',
    href: '/admin/mouldings',
  },
  {
    title: 'Settings',
    description: 'Shop-wide settings and configuration',
    href: '/admin/settings',
  },
]

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-2 gap-6">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="block rounded bg-gray-900 p-6 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
            <p className="text-gray-400 text-sm">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
