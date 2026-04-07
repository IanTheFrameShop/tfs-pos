import Link from 'next/link'

export default function NewWorkOrderPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">New Work Order</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new framing work order</p>
      </div>
      <div className="rounded-xl bg-white border border-gray-200/80 shadow-sm p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <p className="text-sm text-gray-700 mb-2">Work order builder coming soon</p>
        <p className="text-xs text-gray-400 mb-4">
          In the meantime, try the{' '}
          <Link href="/calculator" className="text-blue-600 hover:text-blue-700 font-medium">
            pricing calculator
          </Link>
        </p>
      </div>
    </div>
  )
}
