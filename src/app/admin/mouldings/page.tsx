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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Mouldings</h1>
        <p className="text-sm text-gray-500 mt-1">Browse and search your moulding inventory</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-5">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by item number or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-white border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-12 justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          Searching...
        </div>
      )}

      {!loading && mouldings.length === 0 && (
        <div className="text-center py-16 text-sm text-gray-400">
          {searchQuery ? 'No mouldings match your search.' : 'No mouldings in inventory.'}
        </div>
      )}

      {!loading && mouldings.length > 0 && (
        <>
          <div className="rounded-xl bg-white border border-gray-200/80 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Item #
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Width
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Cost/ft
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Chop
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Join
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mouldings.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-900 font-medium">
                      {m.item_number}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 max-w-xs truncate">
                      {m.description}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                        {m.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-right tabular-nums">
                      {m.width}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-right tabular-nums">
                      ${(m.cost_length / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-right tabular-nums">
                      ${(m.cost_chop / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-right tabular-nums">
                      ${(m.cost_join / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Page {page + 1} &middot; {mouldings.length} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 0 || loading}
                className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 shadow-sm"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={mouldings.length < pageSize || loading}
                className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 shadow-sm"
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
