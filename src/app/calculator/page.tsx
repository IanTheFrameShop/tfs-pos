'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  calcPerimeter, calcInsideDimensions, calcOutsideDimensions,
  calcMouldingPrice, calcMatPrice, calcAreaPrice, calcFilletPrice,
  findMarkup, formatCents, formatDollars, calcUnitedInches,
  type Layer, type Moulding, type CustomerCategory, type MarkupTierRow,
} from '@/lib/pricing'
import { SHOP_ID } from '@/lib/supabase'

const WASTE_FACTORS = { chop: 1.0, length: 1.3, box: 1.1 }

interface LayerState extends Layer { id: string; sheetWidthInches?: number; sheetHeightInches?: number }
interface MarkupTier { id: string; name: string; material_type: string; rows: MarkupTierRow[] }

async function supaRest(table: string, params: Record<string, string> = {}) {
  const url = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`${table}: ${res.status}`)
  return res.json()
}

export default function Calculator() {
  const [artWidth, setArtWidth] = useState<number>(8)
  const [artHeight, setArtHeight] = useState<number>(10)
  const [mouldings, setMouldings] = useState<Moulding[]>([])
  const [mouldingSearch, setMouldingSearch] = useState('')
  const [showMouldingDropdown, setShowMouldingDropdown] = useState(false)
  const [selectedMoulding, setSelectedMoulding] = useState<Moulding | null>(null)
  const [orderType, setOrderType] = useState<'chop' | 'length' | 'box'>('length')
  const [isFloater, setIsFloater] = useState(false)
  const [mouldingMarkupTier, setMouldingMarkupTier] = useState<MarkupTier | null>(null)
  const [layers, setLayers] = useState<LayerState[]>([])
  const [glazingName, setGlazingName] = useState('Acrylic')
  const [glazingCostPerSqFtCents, setGlazingCostPerSqFtCents] = useState<number>(100)
  const [glazingMarkup, setGlazingMarkup] = useState<number>(2.5)
  const [fittingDollars, setFittingDollars] = useState<number>(0)
  const [categories, setCategories] = useState<CustomerCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<CustomerCategory | null>(null)
  const [discountPct, setDiscountPct] = useState<number>(0)
  const [markupTiers, setMarkupTiers] = useState<MarkupTier[]>([])

  useEffect(() => {
    const init = async () => {
      try {
        const tiersData = await supaRest('markup_tiers', { select: 'id,name,material_type', shop_id: `eq.${SHOP_ID}`, is_default: 'eq.true' })
        const tiersWithRows = await Promise.all(tiersData.map(async (tier: MarkupTier) => {
          const rows = await supaRest('markup_tier_rows', { select: 'tier_id,sort_order,cost_threshold,markup', tier_id: `eq.${tier.id}`, order: 'sort_order.asc' })
          return { ...tier, rows }
        }))
        setMarkupTiers(tiersWithRows)
        const mt = tiersWithRows.find((t: MarkupTier) => t.material_type === 'moulding_length')
        if (mt) setMouldingMarkupTier(mt)
        const catsData = await supaRest('customer_categories', { select: 'id,name,slug,default_discount_pct', shop_id: `eq.${SHOP_ID}`, order: 'sort_order.asc' })
        setCategories(catsData)
        if (catsData.length > 0) { setSelectedCategory(catsData[0]); setDiscountPct(catsData[0].default_discount_pct || 0) }
      } catch (err) { console.error('Failed to load data:', err) }
    }
    init()
  }, [])

  const handleMouldingSearch = useCallback(async (query: string) => {
    setMouldingSearch(query)
    if (query.length < 2) { setMouldings([]); return }
    try {
      const results = await supaRest('mouldings', {
        select: 'id,item_number,description,type,width,cost_length,cost_chop,cost_join,vendor_id',
        shop_id: `eq.${SHOP_ID}`,
        or: `(item_number.ilike.*${query}*,description.ilike.*${query}*)`,
        limit: '20', order: 'item_number.asc',
      })
      setMouldings(results)
      setShowMouldingDropdown(true)
    } catch (err) { console.error('Search failed:', err) }
  }, [])

  const insideDims = useMemo(() => calcInsideDimensions(artWidth, artHeight, layers), [artWidth, artHeight, layers])
  const outsideDims = useMemo(() => {
    if (!selectedMoulding) return { width: 0, height: 0 }
    return calcOutsideDimensions(insideDims.width, insideDims.height, selectedMoulding.width, isFloater)
  }, [insideDims, selectedMoulding, isFloater])
  const unitedInches = useMemo(() => calcUnitedInches(insideDims.width, insideDims.height), [insideDims])

  const mouldingPriceCents = useMemo(() => {
    if (!selectedMoulding) return 0
    const tierType = orderType === 'chop' ? 'moulding_chop' : 'moulding_length'
    const tier = markupTiers.find(t => t.material_type === tierType) || mouldingMarkupTier
    if (!tier) return 0
    const costForLookup = orderType === 'chop' ? selectedMoulding.cost_chop : selectedMoulding.cost_length
    const markup = findMarkup(tier.rows, costForLookup)
    return calcMouldingPrice(outsideDims.width, outsideDims.height, selectedMoulding, orderType, WASTE_FACTORS[orderType], markup)
  }, [selectedMoulding, orderType, outsideDims, markupTiers, mouldingMarkupTier])

  const layerPrices = useMemo(() => {
    return layers.map((layer, idx) => {
      if (layer.type === 'mat' && layer.sheetCostCents) {
        return calcMatPrice(layer.sheetCostCents, layer.sheetWidthInches || 32, layer.sheetHeightInches || 40, insideDims.width, insideDims.height, layer.sheetMarkup || 2.0, layer.usageMarkup || 1.25)
      } else if (layer.type === 'fillet' && selectedMoulding) {
        const markup = mouldingMarkupTier ? findMarkup(mouldingMarkupTier.rows, 0) : 2.5
        return calcFilletPrice(artWidth, artHeight, layers, idx, selectedMoulding, orderType, WASTE_FACTORS[orderType], markup)
      }
      return 0
    })
  }, [layers, insideDims, selectedMoulding, artWidth, artHeight, orderType, mouldingMarkupTier])

  const glazingPriceCents = useMemo(() => calcAreaPrice(insideDims.width, insideDims.height, glazingCostPerSqFtCents, glazingMarkup), [insideDims, glazingCostPerSqFtCents, glazingMarkup])

  const subtotalCents = useMemo(() => {
    return mouldingPriceCents + layerPrices.reduce((s, p) => s + p, 0) + glazingPriceCents + fittingDollars * 100
  }, [mouldingPriceCents, layerPrices, glazingPriceCents, fittingDollars])

  const discountCents = useMemo(() => Math.round((subtotalCents * discountPct) / 100), [subtotalCents, discountPct])
  const totalCents = subtotalCents - discountCents

  const cogCents = useMemo(() => {
    let cost = 0
    if (selectedMoulding) {
      const wf = WASTE_FACTORS[orderType]
      if (orderType === 'chop') { cost += selectedMoulding.cost_chop * 4 + selectedMoulding.cost_join * 4 }
      else { cost += (calcPerimeter(outsideDims.width, outsideDims.height) / 12) * selectedMoulding.cost_length * wf }
    }
    layers.forEach(l => { if (l.type === 'mat' && l.sheetCostCents) cost += l.sheetCostCents })
    cost += ((insideDims.width * insideDims.height) / 144) * glazingCostPerSqFtCents
    return Math.round(cost)
  }, [selectedMoulding, orderType, outsideDims, layers, insideDims, glazingCostPerSqFtCents])

  const marginPct = useMemo(() => { if (totalCents === 0) return 0; return ((totalCents - cogCents) / totalCents) * 100 }, [totalCents, cogCents])

  const addLayer = (type: 'mat' | 'fillet') => {
    setLayers([...layers, { id: `layer-${Date.now()}`, type, width: type === 'mat' ? 1.5 : 0.25, name: type === 'mat' ? 'Mat' : 'Fillet', sheetCostCents: 3000, sheetWidthInches: 32, sheetHeightInches: 40, sheetMarkup: 2.0, usageMarkup: 1.25 }])
  }
  const removeLayer = (id: string) => setLayers(layers.filter(l => l.id !== id))
  const updateLayer = (id: string, updates: Partial<LayerState>) => setLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l))
  const handleCategoryChange = (catId: string) => { const cat = categories.find(c => c.id === catId); if (cat) { setSelectedCategory(cat); setDiscountPct(cat.default_discount_pct || 0) } }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">TFS Pricing Calculator</h1>
        <div className="text-right">
          <div className="text-sm text-gray-400">Total</div>
          <div className="text-3xl font-bold text-green-400">{formatCents(totalCents)}</div>
          <div className="text-xs text-gray-400 mt-2">COG: {formatCents(cogCents)} | Margin: {marginPct.toFixed(1)}%</div>
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Artwork Dimensions */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Artwork Dimensions</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="block text-sm text-gray-400 mb-2">Width (in)</label><input type="number" step="0.125" value={artWidth} onChange={e => setArtWidth(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" /></div>
              <div><label className="block text-sm text-gray-400 mb-2">Height (in)</label><input type="number" step="0.125" value={artHeight} onChange={e => setArtHeight(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" /></div>
            </div>
            <div className="bg-gray-800 p-4 rounded text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-400">Inside (opening):</span><span>{insideDims.width.toFixed(3)}" x {insideDims.height.toFixed(3)}"</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Outside (frame):</span><span>{outsideDims.width.toFixed(3)}" x {outsideDims.height.toFixed(3)}"</span></div>
              <div className="flex justify-between"><span className="text-gray-400">United Inches:</span><span className="text-green-400 font-bold">{unitedInches.toFixed(2)}"</span></div>
            </div>
          </div>
          {/* Frame Moulding */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Frame Moulding</h2>
            <div className="mb-4 relative">
              <label className="block text-sm text-gray-400 mb-2">Search Mouldings</label>
              <input type="text" placeholder="Item #, description..." value={mouldingSearch} onChange={e => handleMouldingSearch(e.target.value)} onFocus={() => setShowMouldingDropdown(true)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              {showMouldingDropdown && mouldings.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded max-h-48 overflow-y-auto z-10">
                  {mouldings.map(m => (
                    <button key={m.id} onClick={() => { setSelectedMoulding(m); setMouldingSearch(m.item_number); setShowMouldingDropdown(false) }} className="w-full px-3 py-2 text-left hover:bg-gray-700 text-sm border-b border-gray-700 last:border-b-0">
                      <div className="font-semibold">{m.item_number}</div>
                      <div className="text-gray-400 text-xs">{m.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedMoulding && (<>
              <div className="bg-gray-800 p-3 rounded mb-4 text-sm"><div className="font-semibold">{selectedMoulding.item_number}</div><div className="text-gray-400">{selectedMoulding.description}</div></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm text-gray-400 mb-2">Order Type</label><select value={orderType} onChange={e => setOrderType(e.target.value as 'chop'|'length'|'box')} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"><option value="chop">Chop</option><option value="length">Length</option><option value="box">Box</option></select></div>
                <div className="flex items-end"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isFloater} onChange={e => setIsFloater(e.target.checked)} className="w-4 h-4" /><span className="text-sm text-gray-400">Floater</span></label></div>
              </div>
              <div className="bg-gray-800 p-4 rounded"><div className="text-sm text-gray-400 mb-1">Waste: {(WASTE_FACTORS[orderType] * 100).toFixed(0)}%</div><div className="text-sm text-gray-400 mb-1">Frame Price</div><div className="text-2xl font-bold text-green-400">{formatCents(mouldingPriceCents)}</div></div>
            </>)}
          </div>
          {/* Layer Stack */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Layer Stack (Mats & Fillets)</h2>
            <div className="space-y-3 mb-4">
              {layers.map((layer, idx) => (
                <div key={layer.id} className="bg-gray-800 p-4 rounded border border-gray-700">
                  <div className="flex gap-4 mb-3">
                    <select value={layer.type} onChange={e => updateLayer(layer.id, { type: e.target.value as 'mat'|'fillet' })} className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"><option value="mat">Mat</option><option value="fillet">Fillet</option></select>
                    <input type="text" placeholder="Name/Color" value={layer.name || ''} onChange={e => updateLayer(layer.id, { name: e.target.value })} className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none" />
                    <input type="number" step="0.125" value={layer.width} onChange={e => updateLayer(layer.id, { width: Number(e.target.value) })} className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none" />
                    <button onClick={() => removeLayer(layer.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">Remove</button>
                  </div>
                  {layer.type === 'mat' && (
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div><label className="block text-gray-400 mb-1">Sheet Cost (cents)</label><input type="number" value={layer.sheetCostCents || 0} onChange={e => updateLayer(layer.id, { sheetCostCents: Number(e.target.value) })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:border-blue-500 focus:outline-none" /></div>
                      <div><label className="block text-gray-400 mb-1">Sheet Markup</label><input type="number" step="0.1" value={layer.sheetMarkup || 2.0} onChange={e => updateLayer(layer.id, { sheetMarkup: Number(e.target.value) })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:border-blue-500 focus:outline-none" /></div>
                      <div><label className="block text-gray-400 mb-1">Usage Markup</label><input type="number" step="0.1" value={layer.usageMarkup || 1.25} onChange={e => updateLayer(layer.id, { usageMarkup: Number(e.target.value) })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:border-blue-500 focus:outline-none" /></div>
                    </div>
                  )}
                  <div className="mt-3 text-sm"><span className="text-gray-400">Price: </span><span className="text-green-400 font-bold">{formatCents(layerPrices[idx] || 0)}</span></div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => addLayer('mat')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Add Mat</button>
              <button onClick={() => addLayer('fillet')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Add Fillet</button>
            </div>
          </div>
          {/* Glazing */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Glazing</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><label className="block text-sm text-gray-400 mb-2">Material</label><input type="text" value={glazingName} onChange={e => setGlazingName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" /></div>
              <div><label className="block text-sm text-gray-400 mb-2">Cost/sqft (cents)</label><input type="number" value={glazingCostPerSqFtCents} onChange={e => setGlazingCostPerSqFtCents(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" /></div>
              <div><label className="block text-sm text-gray-400 mb-2">Markup</label><input type="number" step="0.1" value={glazingMarkup} onChange={e => setGlazingMarkup(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" /></div>
            </div>
            <div className="bg-gray-800 p-4 rounded"><div className="text-sm text-gray-400 mb-1">Glazing Price</div><div className="text-2xl font-bold text-green-400">{formatCents(glazingPriceCents)}</div></div>
          </div>
          {/* Fitting */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Fitting (Labor)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-400 mb-2">Amount ($)</label><input type="number" step="0.01" value={fittingDollars} onChange={e => setFittingDollars(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" /></div>
              <div className="flex items-end"><div className="w-full"><div className="text-sm text-gray-400 mb-1">Price</div><div className="text-2xl font-bold text-green-400">{formatDollars(fittingDollars)}</div></div></div>
            </div>
          </div>
        </div>
        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Customer Category</h2>
            <div className="mb-4"><label className="block text-sm text-gray-400 mb-2">Category</label><select value={selectedCategory?.id || ''} onChange={e => handleCategoryChange(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none">{categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}</select></div>
            <div><label className="block text-sm text-gray-400 mb-2">Discount %</label><input type="number" step="0.1" min="0" max="100" value={discountPct} onChange={e => setDiscountPct(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" /></div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Price Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-400">Frame Moulding</span><span>{formatCents(mouldingPriceCents)}</span></div>
              {layers.map((layer, idx) => (<div key={layer.id} className="flex justify-between"><span className="text-gray-400">{layer.type === 'mat' ? 'Mat' : 'Fillet'}: {layer.name}</span><span>{formatCents(layerPrices[idx] || 0)}</span></div>))}
              <div className="flex justify-between"><span className="text-gray-400">Glazing ({glazingName})</span><span>{formatCents(glazingPriceCents)}</span></div>
              {fittingDollars > 0 && (<div className="flex justify-between"><span className="text-gray-400">Fitting</span><span>{formatDollars(fittingDollars)}</span></div>)}
            </div>
            <div className="border-t border-gray-700 pt-3 space-y-2">
              <div className="flex justify-between font-semibold"><span>Subtotal</span><span>{formatCents(subtotalCents)}</span></div>
              {discountPct > 0 && (<div className="flex justify-between text-red-400"><span>Discount ({discountPct.toFixed(1)}%)</span><span>-{formatCents(discountCents)}</span></div>)}
              <div className="border-t border-gray-700 pt-3 flex justify-between text-xl font-bold text-green-400"><span>Total</span><span>{formatCents(totalCents)}</span></div>
            </div>
            <div className="border-t border-gray-700 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">COG</span><span>{formatCents(cogCents)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Margin %</span><span className="text-green-400 font-bold">{marginPct.toFixed(1)}%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
