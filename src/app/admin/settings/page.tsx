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
  { key: 'waste_factor_chop', label: 'Waste Factor (Chop)', section: 'Waste Factors' },
  { key: 'waste_factor_length', label: 'Waste Factor (Length)', section: 'Waste Factors' },
  { key: 'waste_factor_box', label: 'Waste Factor (Box)', section: 'Waste Factors' },
  { key: 'tax_rate', label: 'Tax Rate (%)', section: 'Pricing' },
  { key: 'min_price_floor', label: 'Minimum Price Floor ($)', section: 'Pricing' },
  { key: 'margin_alert_threshold', label: 'Margin Alert Threshold (%)', section: 'Pricing' },
  { key: 'default_due_days', label: 'Default Due Days', section: 'Defaults' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
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
      setError(null)

      for (const { key } of SETTING_KEYS) {
        const value = values[key] || '0'
        const existing = settings.find((s) => s.key === key)

        if (existing) {
          await supaUpdate(
            'shop_settings',
            { id: `eq.${existing.id}` },
            { value }
          )
        } else {
          await supaInsert('shop_settings', {
            shop_id: SHOP_ID,
            key,
            value,
          })
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-gray-400">Loading...</div>

  const sections: Record<string, typeof SETTING_KEYS> = {}
  SETTING_KEYS.forEach((item) => {
    if (!sections[item.section]) sections[item.section] = []
    sections[item.section].push(item)
  })

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Shop Settings</h1>
      {error && (
        <div className="mb-4 rounded bg-red-900/20 p-3 text-red-300">
          {error}
        </div>
      )}

      <div className="max-w-2xl space-y-8">
        {Object.entries(sections).map(([section, items]) => (
          <fieldset key={section} className="space-y-4">
            <legend className="text-lg font-semibold">{section}</legend>
            <div className="space-y-3 rounded bg-gray-900 p-4">
              {items.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-300">
                    {label}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={values[key] || ''}
                    onChange={(e) =>
                      setValues({ ...values, [key]: e.target.value })
                    }
                    className="mt-1 w-full rounded bg-gray-800 border border-gray-600 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-8 rounded bg-blue-600 px-6 py-2 font-medium hover:bg-blue-700 disabled:bg-gray-700"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}
