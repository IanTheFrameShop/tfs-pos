import Link from 'next/link'

const sections = [
  {
    title: 'Markup Tiers',
    description: 'Pricing tiers and markup multipliers',
    href: '/admin/markup-tiers',
  },
  {
    title: 'Services & Fitting',
    description: 'Service offerings and fitting options',
    href: '/admin/services',
  },
  {
    title: 'Glazing Types',
    description: 'Glazing options and pricing',
    href: '/admin/glazing',
  },
  {
    title: 'Matboards',
    description: 'Matboard catalog and costs',
    href: '/admin/matboards',
  },
  {
    title: 'Customer Categories',
    description: 'Customer segments and discounts',
    href: '/admin/categories',
  },
  {
    title: 'Mouldings',
    description: 'Moulding inventory and costs',
    href: '/admin/mouldings',
  },
  {
    title: 'Settings',
    description: 'Shop-wide configuration',
    href: '/admin/settings',
  },
]

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your shop configuration</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group block rounded-xl bg-white p-5 border border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
          >
            <h2 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
              {section.title}
            </h2>
            <p className="text-gray-500 text-xs mt-1">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
