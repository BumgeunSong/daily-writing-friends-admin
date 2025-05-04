import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

/**
 * Firestore 컬렉션을 구독하는 커스텀 훅
 * @param collectionName - 컬렉션 이름
 * @param constraints - 쿼리 제약조건 (반드시 useMemo로 감싸서 넘기세요)
 * @example
 * const constraints = useMemo(() => [where('foo', '==', 'bar')], [...])
 * const { data } = useCollection('myCollection', constraints)
 */
export function useCollection(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let ignore = false
    const fetchData = async () => {
      try {
        const colRef = collection(db, collectionName)
        const q = constraints.length ? query(colRef, ...constraints) : colRef
        const snapshot = await getDocs(q)
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        if (!ignore) setData(docs)
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchData()
    return () => { ignore = true }
  }, [collectionName, constraints])

  return { data, loading, error }
}