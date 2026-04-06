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

  // Fetch all tiers and their rows
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
        setError(
          err instanceof Error ? err.message : 'Failed to load markup tiers'
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Load rows when selected tier changes
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
      const nextOrder = Math.max(
        0,
        ...rows.map((r) => r.sort_order)
      )
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
      // Update tier if edited
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

      // Update rows if edited
      for (const rowId of Object.keys(editedRows)) {
        const row = rows.find((r) => r.id === rowId)
        if (row) {
          await supaUpdate('markup_tier_rows', { id: `eq.${rowId}` }, {
            cost_threshold:
              editedRows[rowId].cost_threshold ?? row.cost_threshold,
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

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Markup Tiers</h1>
      {error && (
        <div className="mb-4 rounded bg-red-900/20 p-3 text-red-300">
          {error}
        </div>
      )}
      <div className="flex gap-8">
        {/* Left Panel: Tier List */}
        <div className="w-1/2">
          <div className="space-y-2">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`cursor-pointer rounded border-l-4 p-4 transition-colors ${
                  selectedTierId === tier.id
                    ? 'border-blue-500 bg-gray-800'
                    : 'border-gray-700 bg-gray-900 hover:bg-gray-800'
                }`}
                onClick={() => handleSelectTier(tier.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tier.name}</p>
                    <div className="mt-1 flex gap-2">
                      <span className="inline-block rounded bg-gray-700 px-2 py-1 text-xs text-gray-300">
                        {tier.material_type === 'moulding_chop'
                          ? 'Chop'
                          : 'Length'}
                      </span>
                      {tier.is_default && (
                        <span className="inline-block rounded bg-blue-700 px-2 py-1 text-xs text-blue-100">
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
                    className="text-red-400 hover:text-red-300 disabled:text-gray-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddTier}
            disabled={saving}
            className="mt-4 w-full rounded bg-blue-600 py-2 font-medium hover:bg-blue-700 disabled:bg-gray-700"
          >
            Add Tier
          </button>
        </div>

        {/* Right Panel: Tier Details */}
        {selectedTier && (
          <div className="w-1/2 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Tier Name
              </label>
              <input
                type="text"
                value={editedTier.name ?? selectedTier.name}
                onChange={(e) =>
                  setEditedTier({ ...editedTier, name: e.target.value })
                }
                className="mt-1 w-full rounded bg-gray-800 border border-gray-600 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Material Type
              </label>
              <select
                value={editedTier.material_type ?? selectedTier.material_type}
                onChange={(e) =>
                  setEditedTier({
                    ...editedTier,
                    material_type: e.target.value as
                      | 'moulding_chop'
                      | 'moulding_length',
                  })
                }
                className="mt-1 w-full rounded bg-gray-800 border border-gray-600 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="moulding_chop">Moulding Chop</option>
                <option value="moulding_length">Moulding Length</option>
              </select>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editedTier.is_default ?? selectedTier.is_default}
                onChange={(e) =>
                  setEditedTier({
                    ...editedTier,
                    is_default: e.target.checked,
                  })
                }
                className="rounded border-gray-600 bg-gray-800"
              />
              <span className="text-sm font-medium text-gray-300">
                Default Tier
              </span>
            </label>

            {/* Rows Table */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Pricing Rows</h3>
              <div className="overflow-hidden rounded border border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">
                        Cost Up To
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">
                        Markup
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={
                          idx !== rows.length - 1
                            ? 'border-b border-gray-700'
                            : ''
                        }
                      >
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={(
                              (editedRows[row.id]?.cost_threshold ??
                                row.cost_threshold) / 100
                            ).toFixed(2)}
                            onChange={(e) =>
                              setEditedRows({
                                ...editedRows,
                                [row.id]: {
                                  ...editedRows[row.id],
                                  cost_threshold: Math.round(
                                    parseFloat(e.target.value) * 100
                                  ),
                                },
                              })
                            }
                            className="w-24 rounded bg-gray-800 border border-gray-600 px-2 py-1 text-white focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.1"
                            value={
                              editedRows[row.id]?.markup ?? row.markup
                            }
                            onChange={(e) =>
                              setEditedRows({
                                ...editedRows,
                                [row.id]: {
                                  ...editedRows[row.id],
                                  markup: parseFloat(e.target.value),
                                },
                              })
                            }
                            className="w-24 rounded bg-gray-800 border border-gray-600 px-2 py-1 text-white focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            disabled={saving}
                            className="text-red-400 hover:text-red-300 disabled:text-gray-500"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handleAddRow}
                disabled={saving}
                className="mt-4 rounded bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:bg-gray-700"
              >
                Add Row
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={
                saving ||
                (Object.keys(editedTier).length === 0 &&
                  Object.keys(editedRows).length === 0)
              }
              className="w-full rounded bg-blue-600 py-2 font-medium hover:bg-blue-700 disabled:bg-gray-700"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
