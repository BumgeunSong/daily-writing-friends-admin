import { useState, useEffect } from 'react'
import { getFirestore, doc, onSnapshot, DocumentData } from 'firebase/firestore'

interface UseDocumentReturn<T extends DocumentData> {
  document: (T & { id: string }) | null
  loading: boolean
  error: Error | null
}

/**
 * Firestore 문서를 실시간으로 구독하는 훅
 * @param path 문서 경로 (예: 'users/userId')
 * @returns 문서 데이터, 로딩 상태, 에러 상태
 */
export function useDocument<T extends DocumentData>(path: string | null): UseDocumentReturn<T> {
  const [document, setDocument] = useState<(T & { id: string }) | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!path) {
      setDocument(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const db = getFirestore()
    const docRef = doc(db, path)
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setDocument({
            id: snapshot.id,
            ...snapshot.data() as T
          })
        } else {
          setDocument(null)
        }
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching document:', err)
        setError(err)
        setLoading(false)
      }
    )

    // Clean up subscription on unmount
    return () => unsubscribe()
  }, [path])

  return { document, loading, error }
} 