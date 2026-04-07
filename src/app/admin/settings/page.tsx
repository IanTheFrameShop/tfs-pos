'use client'

import { useEffect, useState } from 'react'
import { SHOP_ID, supaRest, supaUpdate, supaInsert } from '@/lib/api'

interface ShopSetting {
  id: string
  shop_id: string
  key: string
  value: string
}

const SETTING_KEYS = [
  { key: 'waste_factor_chop', label: 'Waste Factor (Chop)', hint: 'Multiplier for chop waste', section: 'Waste Factors' },
  { key: 'waste_factor_length', label: 'Waste Factor (Length)', hint: 'Multiplier for length waste', section: 'Waste Factors' },
  { key: 'waste_factor_box', label: 'Waste Factor (Box)', hint: 'Multiplier for box waste', section: 'Waste Factors' },
  { key: 'tax_rate', label: 'Tax Rate', hint: 'Percentage', section: 'Pricing' },
  { key: 'min_price_floor', label: 'Minimum Price Floor', hint: 'In dollars', section: 'Pricing' },
  { key: 'margin_alert_threshold', label: 'Margin Alert Threshold', hint: 'Percentage', section: 'Pricing' },
  { key: 'default_due_days', label: 'Default Due Days', hint: 'Days from order creation', section: 'Defaults' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await supaRest('shop_settings', {
          shop_id: `eq.${SHOP_ID}`,
        })
        setSettings(data || [])
        const valuesMap: Record<string, string> = {}
        data?.forEach((s: ShopSetting) => {
          valuesMap[s.key] = s.value
        })
        setValues(valuesMap)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaved(false)
      setError(null)

      for (const { key } of SETTING_KEYS) {
        const value = values[key] || '0'
        const existing = settings.find((s) => s.key === key)

        if (existing) {
          await supaUpdate('shop_settings', { id: `eq.${existing.id}` }, { value })
        } else {
          await supaInsert('shop_settings', { shop_id: SHOP_ID, key, value })
        }
      }

      setSettings(
        SETTING_KEYS.map(({ key }) => ({
          id: settings.find((s) => s.key === key)?.id || `new-${key}`,
          shop_id: SHOP_ID,
          key,
          value: values[key] || '0',
        }))
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-12">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        Loading settings...
      </div>
    )
  }

  const sections: Record<string, typeof SETTING_KEYS> = {}
  SETTING_KEYS.forEach((item) => {
    if (!sections[item.section]) sections[item.section] = []
    sections[item.section].push(item)
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Shop-wide configuration and defaults</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="max-w-xl space-y-6">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section} className="rounded-xl bg-white border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{section}</h2>
            </div>
            <div className="p-5 space-y-4">
              {items.map(({ key, label, hint }) => (
                <div key={key}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">{label}</label>
                    {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={values[key] || ''}
                    onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                    className="w-full rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">Settings saved</span>
          )}
        </div>
      </div>
    </div>
  )
}
