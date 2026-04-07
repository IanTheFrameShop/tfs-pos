import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-56px)]">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-lg font-bold tracking-tight">TFS</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          The Frame Shop POS
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Point of sale and work order management
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/orders/new"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white shadow-sm"
          >
            New Work Order
          </Link>
          <Link
            href="/admin"
            className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-200 shadow-sm"
          >
            Admin
          </Link>
        </div>
      </div>
    </main>
  )
}
