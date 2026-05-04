'use client'

import { useCurrencySummary } from '@/features/documents/hooks/use-documents'

export const CurrencyTotals = () => {
  const { data: summaries = [], isLoading } = useCurrencySummary()

  if (isLoading || summaries.length === 0) return null

  return (
    <div className="flex flex-wrap gap-3">
      {summaries.map((summary) => (
        <div
          key={summary.currency}
          className="flex flex-col px-4 py-3 border rounded-lg min-w-32"
        >
          <span className="text-xs text-muted-foreground">
            {summary.currency} · {summary.count} document{summary.count !== 1 ? 's' : ''}
          </span>
          <span className="text-lg font-semibold mt-0.5">
            {summary.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  )
}