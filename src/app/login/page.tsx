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

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg" style={{ backgroundColor: 'var(--background)' }}>
        <h1 className="text-2xl font-semibold text-center mb-6">관리자 로그인</h1>
        {loading ? (
          <p className="text-center text-gray-500">인증 확인 중...</p>
        ) : (
          <button
            onClick={login}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
          >
            Google로 로그인
          </button>
        )}
      </div>
    </main>
  )
}