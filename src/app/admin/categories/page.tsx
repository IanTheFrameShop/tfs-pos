'use client'

import { useEffect, useState } from 'react'
import { SHOP_ID, supaRest, supaInsert, supaUpdate, supaDelete } from '@/lib/api'

interface CustomerCategory {
  id: string
  shop_id: string
  name: string
  slug: string
  description: string
  default_discount_pct: number
  sort_order: number
  is_default: boolean
}

type EditField = { categoryId: string; field: keyof CustomerCategory }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CustomerCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingField, setEditingField] = useState<EditField | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await supaRest('customer_categories', {
          shop_id: `eq.${SHOP_ID}`,
          order: 'sort_order.asc',
        })
        setCategories(data || [])
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load categories'
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleAddCategory = async () => {
    try {
      setSaving(true)
      const newCat = await supaInsert('customer_categories', {
        shop_id: SHOP_ID,
        name: 'New Category',
        slug: 'new-category',
        description: '',
        default_discount_pct: 0,
        sort_order: (Math.max(...categories.map((c) => c.sort_order), 0) + 1),
        is_default: false,
      })
      setCategories([...categories, newCat[0]])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateField = async (
    categoryId: string,
    field: keyof CustomerCategory,
    value: any
  ) => {
    try {
      setSaving(true)
      await supaUpdate(
        'customer_categories',
        { id: `eq.${categoryId}` },
        { [field]: value }
      )
      setCategories(
        categories.map((c) =>
          c.id === categoryId ? { ...c, [field]: value } : c
        )
      )
      setEditingField(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Delete this category?')) return
    try {
      setSaving(true)
      await supaDelete('customer_categories', { id: `eq.${categoryId}` })
      setCategories(categories.filter((c) => c.id !== categoryId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Customer Categories</h1>
      {error && (
        <div className="mb-4 rounded bg-red-900/20 p-3 text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded border border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr className="border-b border-gray-700">
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">
                Discount %
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">
                Default
              </th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, idx) => (
              <tr
                key={cat.id}
                className={
                  idx !== categories.length - 1
                    ? 'border-b border-gray-700'
                    : ''
                }
              >
                <td className="px-6 py-3">
                  {editingField?.categoryId === cat.id &&
                  editingField?.field === 'name' ? (
                    <input
                      type="text"
                      defaultValue={cat.name}
                      onBlur={(e) => handleUpdateField(cat.id, 'name', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')
                          handleUpdateField(cat.id, 'name', e.currentTarget.value)
                      }}
                      autoFocus
                      className="w-full rounded bg-gray-800 border border-gray-600 px-2 py-1 text-white focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingField({ categoryId: cat.id, field: 'name' })}
                      className="text-left hover:text-blue-400"
                    >
                      {cat.name}
                    </button>
                  )}
                </td>
                <td className="px-6 py-3">
                  {editingField?.categoryId === cat.id &&
                  editingField?.field === 'default_discount_pct' ? (
                    <input
                      type="number"
                      step="0.1"
                      defaultValue={cat.default_discount_pct}
                      onBlur={(e) =>
                        handleUpdateField(
                          cat.id,
                          'default_discount_pct',
                          parseFloat(e.target.value)
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')
                          handleUpdateField(
                            cat.id,
                            'default_discount_pct',
                            parseFloat(e.currentTarget.value)
                          )
                      }}
                      autoFocus
                      className="w-20 rounded bg-gray-800 border border-gray-600 px-2 py-1 text-white focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() =>
                        setEditingField({
                          categoryId: cat.id,
                          field: 'default_discount_pct',
                        })
                      }
                      className="hover:text-blue-400"
                    >
                      {cat.default_discount_pct.toFixed(1)}%
                    </button>
                  )}
                </td>
                <td className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={cat.is_default}
                    onChange={(e) =>
                      handleUpdateField(cat.id, 'is_default', e.target.checked)
                    }
                    disabled={cat.is_default}
                    className="rounded border-gray-600 bg-gray-800"
                  />
                </td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    disabled={saving || cat.is_default}
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
        onClick={handleAddCategory}
        disabled={saving}
        className="mt-4 rounded bg-blue-600 px-6 py-2 font-medium hover:bg-blue-700 disabled:bg-gray-700"
      >
        Add Category
      </button>
    </div>
  )
}
