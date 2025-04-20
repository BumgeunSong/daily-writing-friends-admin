'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useCollection } from '@/hooks/useCollection'

const ADMIN_EMAIL = 'isp1195@gmail.com'

export default function AdminHome() {
  const { user, logout, loading } = useAuth()
  const { data: users, loading: usersLoading } = useCollection('users')
  const router = useRouter()

  const isAdmin = user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || usersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-red-500 font-medium">Access Denied</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={logout}
            className="text-sm text-blue-600 underline hover:text-blue-800"
          >
            Logout
          </button>
        </div>

        <div className="space-y-4">
          {users.map((u) => (
            <div
              key={u.id}
              className="border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50"
            >
              <p><span className="font-medium">Name:</span> {u.name}</p>
              <p><span className="font-medium">Email:</span> {u.email}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}