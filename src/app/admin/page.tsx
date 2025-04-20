'use client'

import { useCollection } from '@/hooks/useCollection'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const ADMIN_EMAIL = 'isp1195@gmail.com'

export default function AdminPage() {
  const { user, logout, loading: authLoading } = useAuth()
  const { data: users, loading: usersLoading, error: dataError } = useCollection('users')
  const router = useRouter()

  const isAdmin = user?.email === ADMIN_EMAIL

  // 인증 상태 확인 및 권한 없는 사용자 리디렉션
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // 로딩 중인 경우
  if (authLoading || usersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    )
  }

  // 관리자가 아닌 경우
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-medium">접근 권한이 없습니다</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto rounded-xl shadow-md p-6" style={{ backgroundColor: 'var(--background)' }}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
          <button
            onClick={logout}
            className="text-sm text-blue-600 underline hover:text-blue-800"
          >
            로그아웃
          </button>
        </div>

        {dataError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        )}

        <div className="space-y-4">
          {!users || users.length === 0 ? (
            <p className="text-gray-500">사용자가 없습니다</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50"
              >
                <p><span className="font-medium">이름:</span> {user.name}</p>
                <p><span className="font-medium">이메일:</span> {user.email}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}