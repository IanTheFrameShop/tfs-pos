import Link from 'next/link'

export default function OrdersPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Work Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all framing orders</p>
        </div>
        <Link
          href="/orders/new"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
        >
          + New Work Order
        </Link>
      </div>
      <div className="rounded-xl bg-white border border-gray-200/80 shadow-sm p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500 mb-1">No work orders yet</p>
        <p className="text-xs text-gray-400">Work order management is being built out.</p>
      </div>
    </div>
  )
}
