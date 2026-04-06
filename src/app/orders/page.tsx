import Link from 'next/link'

export default function OrdersPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Work Orders</h1>
      <p className="text-gray-400 mb-6">Coming soon...</p>
      <Link
        href="/orders/new"
        className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
      >
        New Work Order
      </Link>
    </div>
  )
}
