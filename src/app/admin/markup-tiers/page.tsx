'use client'

import { useEffect, useState } from 'react'
import { SHOP_ID, supaRest, supaInsert, supaUpdate, supaDelete } from '@/lib/api'

interface MarkupTier {
  id: string
  shop_id: string
  name: string
  material_type: 'moulding_chop' | 'moulding_length'
  is_default: boolean
  vendor_id: string | null
}

interface MarkupTierRow {
  id: string
  tier_id: string
  sort_order: number
  cost_threshold: number
  markup: number
}

type EditedTier = Partial<MarkupTier>
type EditedRows = Record<string, Partial<MarkupTierRow>>

export default function MarkupTiersPage() {
  const [tiers, setTiers] = useState<MarkupTier[]>([])
  const [rows, setRows] = useState<MarkupTierRow[]>([])
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [editedTier, setEditedTier] = useState<EditedTier>({})
  const [editedRows, setEditedRows] = useState<EditedRows>({})

  const selectedTier = tiers.find((t) => t.id === selectedTierId)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const tiersData = await supaRest('markup_tiers', {
          shop_id: `eq.${SHOP_ID}`,
        })
        setTiers(tiersData || [])

        if (tiersData?.length > 0) {
          const firstTierId = tiersData[0].id
          setSelectedTierId(firstTierId)
          const rowsData = await supaRest('markup_tier_rows', {
            tier_id: `eq.${firstTierId}`,
            order: 'sort_order.asc',
          })
          setRows(rowsData || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load markup tiers')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const loadRowsForTier = async (tierId: string) => {
    try {
      const rowsData = await supaRest('markup_tier_rows', {
        tier_id: `eq.${tierId}`,
        order: 'sort_order.asc',
      })
      setRows(rowsData || [])
      setEditedRows({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rows')
    }
  }

  const handleSelectTier = (tierId: string) => {
    setSelectedTierId(tierId)
    setEditedTier({})
    loadRowsForTier(tierId)
  }

  const handleAddTier = async () => {
    try {
      setSaving(true)
      const newTier = await supaInsert('markup_tiers', {
        shop_id: SHOP_ID,
        name: 'New Tier',
        material_type: 'moulding_chop',
        is_default: false,
      })
      setTiers([...tiers, newTier[0]])
      setSelectedTierId(newTier[0].id)
      setEditedTier({})
      setRows([])
      setEditedRows({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tier')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTier = async (tierId: string) => {
    if (!window.confirm('Delete this tier and all its rows?')) return
    try {
      setSaving(true)
      await supaDelete('markup_tier_rows', { tier_id: `eq.${tierId}` })
      await supaDelete('markup_tiers', { id: `eq.${tierId}` })
      const updated = tiers.filter((t) => t.id !== tierId)
      setTiers(updated)
      if (selectedTierId === tierId) {
        if (updated.length > 0) {
          handleSelectTier(updated[0].id)
        } else {
          setSelectedTierId(null)
          setRows([])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tier')
    } finally {
      setSaving(false)
    }
  }

  const handleAddRow = async () => {
    if (!selectedTierId) return
    try {
      setSaving(true)
      const nextOrder = Math.max(0, ...rows.map((r) => r.sort_order))
      const newRow = await supaInsert('markup_tier_rows', {
        tier_id: selectedTierId,
        sort_order: nextOrder + 1,
        cost_threshold: 0,
        markup: 2.5,
      })
      setRows([...rows, newRow[0]])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add row')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRow = async (rowId: string) => {
    if (!window.confirm('Delete this row?')) return
    try {
      setSaving(true)
      await supaDelete('markup_tier_rows', { id: `eq.${rowId}` })
      setRows(rows.filter((r) => r.id !== rowId))
      const newEdited = { ...editedRows }
      delete newEdited[rowId]
      setEditedRows(newEdited)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete row')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!selectedTier) return
    try {
      setSaving(true)
      if (Object.keys(editedTier).length > 0) {
        await supaUpdate('markup_tiers', { id: `eq.${selectedTier.id}` }, {
          name: editedTier.name ?? selectedTier.name,
          material_type: editedTier.material_type ?? selectedTier.material_type,
          is_default: editedTier.is_default ?? selectedTier.is_default,
        })
        setTiers(
          tiers.map((t) =>
            t.id === selectedTier.id ? { ...t, ...editedTier } : t
          )
        )
        setEditedTier({})
      }

      for (const rowId of Object.keys(editedRows)) {
        const row = rows.find((r) => r.id === rowId)
        if (row) {
          await supaUpdate('markup_tier_rows', { id: `eq.${rowId}` }, {
            cost_threshold: editedRows[rowId].cost_threshold ?? row.cost_threshold,
            markup: editedRows[rowId].markup ?? row.markup,
          })
        }
      }

      if (Object.keys(editedRows).length > 0) {
        setRows(
          rows.map((r) =>
            editedRows[r.id] ? { ...r, ...editedRows[r.id] } : r
          )
        )
        setEditedRows({})
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const hasEdits = Object.keys(editedTier).length > 0 || Object.keys(editedRows).length > 0

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-12">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        Loading tiers...
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Markup Tiers</h1>
        <p className="text-sm text-gray-500 mt-1">Set pricing multipliers by cost threshold</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-6">
        {/* Left Panel: Tier List */}
        <div className="w-72 shrink-0">
          <div className="space-y-1.5">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`cursor-pointer rounded-lg p-3.5 border transition-all ${
                  selectedTierId === tier.id
                    ? 'border-blue-200 bg-blue-50/70 shadow-sm'
                    : 'border-gray-200/80 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => handleSelectTier(tier.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tier.name}</p>
                    <div className="mt-1.5 flex gap-1.5">
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                        {tier.material_type === 'moulding_chop' ? 'Chop' : 'Length'}
                      </span>
                      {tier.is_default && (
                        <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTier(tier.id)
                    }}
                    disabled={saving}
                    className="text-xs text-gray-400 hover:text-red-600 disabled:text-gray-300 mt-0.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddTier}
            disabled={saving}
            className="mt-3 w-full rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 disabled:opacity-50 transition-all"
          >
            + Add Tier
          </button>
        </div>

        {/* Right Panel: Tier Details */}
        {selectedTier && (
          <div className="flex-1 min-w-0">
            <div className="rounded-xl bg-white border border-gray-200/80 shadow-sm p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Tier Name
                  </label>
                  <input
                    type="text"
                    value={editedTier.name ?? selectedTier.name}
                    onChange={(e) =>
                      setEditedTier({ ...editedTier, name: e.target.value })
                    }
                    className="w-full rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Material Type
                  </label>
                  <select
                    value={editedTier.material_type ?? selectedTier.material_type}
                    onChange={(e) =>
                      setEditedTier({
                        ...editedTier,
                        material_type: e.target.value as 'moulding_chop' | 'moulding_length',
                      })
                    }
                    className="w-full rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="moulding_chop">Moulding Chop</option>
                    <option value="moulding_length">Moulding Length</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editedTier.is_default ?? selectedTier.is_default}
                  onChange={(e) =>
                    setEditedTier({ ...editedTier, is_default: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Default tier for this material type</span>
              </label>

              {/* Pricing Rows */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Pricing Rows</h3>
                  <button
                    onClick={handleAddRow}
                    disabled={saving}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                  >
                    + Add Row
                  </button>
                </div>

                {rows.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                    No pricing rows yet
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                            Cost Up To
                          </th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                            Markup
                          </th>
                          <th className="px-4 py-2.5 w-16" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rows.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-400">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={(
                                    (editedRows[row.id]?.cost_threshold ?? row.cost_threshold) / 100
                                  ).toFixed(2)}
                                  onChange={(e) =>
                                    setEditedRows({
                                      ...editedRows,
                                      [row.id]: {
                                        ...editedRows[row.id],
                                        cost_threshold: Math.round(parseFloat(e.target.value) * 100),
                                      },
                                    })
                                  }
                                  className="w-24 rounded-md bg-white border border-gray-200 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={editedRows[row.id]?.markup ?? row.markup}
                                  onChange={(e) =>
                                    setEditedRows({
                                      ...editedRows,
                                      [row.id]: {
                                        ...editedRows[row.id],
                                        markup: parseFloat(e.target.value),
                                      },
                                    })
                                  }
                                  className="w-20 rounded-md bg-white border border-gray-200 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                                />
                                <span className="text-xs text-gray-400">x</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <button
                                onClick={() => handleDeleteRow(row.id)}
                                disabled={saving}
                                className="text-xs text-gray-400 hover:text-red-600 disabled:text-gray-300"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !hasEdits}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 shadow-sm transition-all"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
