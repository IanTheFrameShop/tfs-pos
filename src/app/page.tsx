import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-65px)]">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">TFS POS</h1>
        <p className="text-gray-400 mb-8">The Frame Shop Point of Sale System</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/orders/new"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
          >
            New Work Order
          </Link>
          <Link
            href="/admin"
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded font-medium transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </main>
  )
}
