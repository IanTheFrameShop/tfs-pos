'use client'

import { useEffect, useState } from 'react'
import { SHOP_ID, supaRest } from '@/lib/api'

interface Moulding {
  id: string
  shop_id: string
  item_number: string
  description: string
  type: string
  width: number
  cost_length: number
  cost_chop: number
  cost_join: number
  vendor_id: string | null
}

export default function MouldingsPage() {
  const [mouldings, setMouldings] = useState<Moulding[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const pageSize = 50

  const loadMouldings = async (query: string, pageNum: number) => {
    try {
      setLoading(true)
      setError(null)

      let params: Record<string, string> = {
        shop_id: `eq.${SHOP_ID}`,
        order: 'item_number.asc',
        limit: `${pageSize}`,
        offset: `${pageNum * pageSize}`,
      }

      if (query.trim()) {
        params.or = `(item_number.ilike.*${query}*,description.ilike.*${query}*)`
      }

      const data = await supaRest('mouldings', params)
      setMouldings(data || [])
      setTotal(data?.length || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mouldings')
      setMouldings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(0)
    loadMouldings(searchQuery, 0)
  }, [searchQuery])

  const handleNextPage = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadMouldings(searchQuery, nextPage)
  }

  const handlePrevPage = () => {
    if (page > 0) {
      const prevPage = page - 1
      setPage(prevPage)
      loadMouldings(searchQuery, prevPage)
    }
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Mouldings</h1>
      {error && (
        <div className="mb-4 rounded bg-red-900/20 p-3 text-red-300">
          {error}
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by item number or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded bg-gray-800 border border-gray-600 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {loading && <div className="text-gray-400">Loading...</div>}

      {!loading && mouldings.length === 0 && (
        <div className="text-gray-400">No mouldings found.</div>
      )}

      {!loading && mouldings.length > 0 && (
        <>
          <div className="overflow-hidden rounded border border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Item #
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Width
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Cost/ft
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Cost Chop
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Cost Join
                  </th>
                </tr>
              </thead>
              <tbody>
                {mouldings.map((m, idx) => (
                  <tr
                    key={m.id}
                    className={
                      idx !== mouldings.length - 1
                        ? 'border-b border-gray-700'
                        : ''
                    }
                  >
                    <td className="px-4 py-2 font-mono text-sm">
                      {m.item_number}
                    </td>
                    <td className="px-4 py-2 text-sm">{m.description}</td>
                    <td className="px-4 py-2 text-sm">{m.type}</td>
                    <td className="px-4 py-2 text-sm">{m.width}</td>
                    <td className="px-4 py-2 text-sm">
                      ${(m.cost_length / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      ${(m.cost_chop / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      ${(m.cost_join / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {page * pageSize + 1}–
              {Math.min((page + 1) * pageSize, total)} of {total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 0 || loading}
                className="rounded bg-gray-800 px-4 py-2 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-500"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={mouldings.length < pageSize || loading}
                className="rounded bg-gray-800 px-4 py-2 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-500"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
