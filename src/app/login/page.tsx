'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { user, login, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) router.push('/admin')
  }, [user, router])

  if (loading) return <p>Loading...</p>

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Admin Login</h1>
      <button onClick={login} className="bg-blue-600 text-white px-4 py-2 rounded">
        Sign in with Google
      </button>
    </div>
  )
}