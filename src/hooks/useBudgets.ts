import { useEffect, useState } from 'react'
import type { Budget } from '../lib/budgets'
import { budgetService } from '../services'

export function useBudgets(uid: string) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return budgetService.subscribe(
      uid,
      (list) => {
        setBudgets(list)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
  }, [uid])

  return { budgets, loading, error }
}
