export interface Layer { type: 'mat' | 'fillet'; width: number; sheetCostCents?: number; sheetMarkup?: number; usageMarkup?: number; name?: string; color?: string }
export interface Moulding { id: string; item_number: string; description: string; type: string; width: number; cost_length: number; cost_chop: number; cost_join: number; vendor_id?: string }
export interface CustomerCategory { id: string; name: string; slug: string; default_discount_pct: number }
export interface MarkupTierRow { tier_id: string; sort_order: number; cost_threshold: number; markup: number }

export function calcPerimeter(w: number, h: number): number { return 2 * (w + h) }

export function calcInsideDimensions(artW: number, artH: number, layers: Layer[]): { width: number; height: number } {
  const totalLayerWidth = layers.reduce((sum, l) => sum + l.width, 0)
  return { width: artW + totalLayerWidth * 2, height: artH + totalLayerWidth * 2 }
}

export function calcOutsideDimensions(insideW: number, insideH: number, mouldingW: number, isFloater: boolean): { width: number; height: number } {
  const add = isFloater ? mouldingW * 2 : (mouldingW - 0.25) * 2
  return { width: insideW + add, height: insideH + add }
}

export function calcMouldingPrice(outsideW: number, outsideH: number, m: Moulding, orderType: 'chop'|'length'|'box', wasteFactor: number, markup: number): number {
  let cost: number
  if (orderType === 'chop') { cost = m.cost_chop * 4 + m.cost_join * 4 }
  else { cost = (calcPerimeter(outsideW, outsideH) / 12) * m.cost_length * wasteFactor }
  return Math.round(cost * markup)
}

export function calcMatPrice(sheetCostCents: number, sheetW: number, sheetH: number, matW: number, matH: number, sheetMarkup: number, usageMarkup: number): number {
  const usageFraction = (matW * matH) / (sheetW * sheetH)
  return Math.round(sheetCostCents * (sheetMarkup + usageFraction * usageMarkup))
}

export function calcAreaPrice(insideW: number, insideH: number, costPerSqFtCents: number, markup: number): number {
  return Math.round(((insideW * insideH) / 144) * costPerSqFtCents * markup)
}

export function findMarkup(tierRows: MarkupTierRow[], costCents: number): number {
  if (!tierRows || tierRows.length === 0) return 3.0
  const sorted = [...tierRows].sort((a, b) => a.cost_threshold - b.cost_threshold)
  for (const row of sorted) { if (costCents <= row.cost_threshold) return row.markup }
  return sorted[sorted.length - 1].markup
}

export function formatCents(cents: number): string { return '$' + (cents / 100).toFixed(2) }
export function formatDollars(dollars: number): string { return '$' + dollars.toFixed(2) }

export function calcFilletPerimeter(artW: number, artH: number, layers: Layer[], filletIndex: number): number {
  let insideW = 0
  for (let i = filletIndex + 1; i < layers.length; i++) { insideW += layers[i].width }
  return 2 * (artW + artH + insideW * 4)
}

export function calcFilletPrice(artW: number, artH: number, layers: Layer[], filletIndex: number, fillet: Moulding, orderType: 'chop'|'length'|'box', wasteFactor: number, markup: number): number {
  const perimIn = calcFilletPerimeter(artW, artH, layers, filletIndex)
  let cost: number
  if (orderType === 'chop') { cost = fillet.cost_chop * 4 + fillet.cost_join * 4 }
  else { cost = (perimIn / 12) * fillet.cost_length * wasteFactor }
  return Math.round(cost * markup)
}

export function calcUnitedInches(w: number, h: number): number { return w + h }
