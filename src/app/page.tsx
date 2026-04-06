import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">TFS POS</h1>
        <p className="text-gray-400 mb-8">The Frame Shop — Point of Sale</p>
        <Link href="/calculator" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg">
          Open Pricing Calculator
        </Link>
      </div>
    </div>
  )
}
