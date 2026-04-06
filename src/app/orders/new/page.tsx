import Link from 'next/link'

export default function NewWorkOrderPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">New Work Order</h1>
      <p className="text-gray-400 mb-6">Pricing calculator being rebuilt...</p>
      <p className="text-gray-400 mb-6">
        In the meantime, you can use the calculator at{' '}
        <Link href="/calculator" className="text-blue-400 hover:text-blue-300">
          /calculator
        </Link>
      </p>
    </div>
  )
}
