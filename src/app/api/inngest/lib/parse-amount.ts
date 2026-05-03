export function parseAmount(raw: string | null | undefined): number | null {
  if (!raw) return null

  const cleaned = raw
    .replace(/\s/g, '')
    .replace(/(\d)[.,](?=\d{3}(?:[.,]|$))/g, '$1') // strip thousand separators
    .replace(',', '.')                                // decimal comma -> dot

  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}