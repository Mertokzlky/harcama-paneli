import { useEffect, useState } from 'react'
import type { Transaction } from '../lib/types'
import { transactionService } from '../services'

export function useTransactions(uid: string) {
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return transactionService.subscribe(
      uid,
      (list) => {
        setData(list)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
  }, [uid])

  return { transactions: data, loading, error }
}
