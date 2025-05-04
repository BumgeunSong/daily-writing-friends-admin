import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useCollection(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const colRef = collection(db, collectionName)
        const q = constraints.length ? query(colRef, ...constraints) : colRef
        const snapshot = await getDocs(q)
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setData(docs)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [collectionName, JSON.stringify(constraints)])

  return { data, loading, error }
}