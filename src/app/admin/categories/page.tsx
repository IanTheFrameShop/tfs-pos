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
        setError(err instanceof Error ? err.message : 'Failed to load categories')
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-12">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        Loading categories...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Customer Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer segments and discount tiers</p>
        </div>
        <button
          onClick={handleAddCategory}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 shadow-sm"
        >
          + Add Category
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-white border border-gray-200/80 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Discount
              </th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Default
              </th>
              <th className="px-5 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3">
                  {editingField?.categoryId === cat.id &&
                  editingField?.field === 'name' ? (
                    <input
                      type="text"
                      defaultValue={cat.name}
                      onBlur={(e) => handleUpdateField(cat.id, 'name', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')
                          handleUpdateField(cat.id, 'name', e.currentTarget.value)
                        if (e.key === 'Escape') setEditingField(null)
                      }}
                      autoFocus
                      className="w-full rounded-md bg-white border border-blue-300 px-2.5 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none shadow-sm"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingField({ categoryId: cat.id, field: 'name' })}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {cat.name}
                    </button>
                  )}
                </td>
                <td className="px-5 py-3">
                  {editingField?.categoryId === cat.id &&
                  editingField?.field === 'default_discount_pct' ? (
                    <input
                      type="number"
                      step="0.1"
                      defaultValue={cat.default_discount_pct}
                      onBlur={(e) =>
                        handleUpdateField(cat.id, 'default_discount_pct', parseFloat(e.target.value))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')
                          handleUpdateField(cat.id, 'default_discount_pct', parseFloat(e.currentTarget.value))
                        if (e.key === 'Escape') setEditingField(null)
                      }}
                      autoFocus
                      className="w-20 rounded-md bg-white border border-blue-300 px-2.5 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none shadow-sm"
                    />
                  ) : (
                    <button
                      onClick={() =>
                        setEditingField({ categoryId: cat.id, field: 'default_discount_pct' })
                      }
                      className="text-sm text-gray-700 hover:text-blue-600"
                    >
                      {cat.default_discount_pct.toFixed(1)}%
                    </button>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  {cat.is_default ? (
                    <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => handleUpdateField(cat.id, 'is_default', true)}
                      className="text-xs text-gray-400 hover:text-blue-600"
                    >
                      Set default
                    </button>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {!cat.is_default && (
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      disabled={saving}
                      className="text-xs text-gray-400 hover:text-red-600 disabled:text-gray-300"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">
            No categories yet. Add one to get started.
          </div>
        )}
      </div>
    </div>
  )
}
