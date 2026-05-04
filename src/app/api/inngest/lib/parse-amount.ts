export function parseAmount(raw: string | null | undefined): number | null {
  if (!raw) return null

  const cleaned = raw.replace(/\s/g, '')

  // if both . and , exist, the first one is the thousand separator
  if (cleaned.includes('.') && cleaned.includes(',')) {
    const dotFirst = cleaned.indexOf('.') < cleaned.indexOf(',')
    return dotFirst
      ? parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))  // 1.234,56 -> 1234.56
      : parseFloat(cleaned.replace(/,/g, ''))                      // 1,234.56 -> 1234.56
  }

  // only comma - could be decimal (1,5) or thousand (1,234)
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    const parts = cleaned.split(',')
    // if the part after comma is exactly 3 digits, treat as thousand separator
    if (parts.length === 2 && parts[1].length === 3) {
      return parseFloat(cleaned.replace(',', ''))
    }
    return parseFloat(cleaned.replace(',', '.'))
  }

  // only dot or neither - standard parseFloat handles it
  return parseFloat(cleaned)
}