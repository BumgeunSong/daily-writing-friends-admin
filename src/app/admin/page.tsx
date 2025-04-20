'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useCollection } from '@/hooks/useCollection'

export default function AdminHome() {
  const { user, logout, loading } = useAuth()
  const { data: users, loading: usersLoading } = useCollection('users')
  const router = useRouter()

  const isAdmin = user?.email === 'your@email.com'

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || usersLoading) return <p>Loading...</p>
  if (!isAdmin) return <p>Access Denied</p>

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Admin Dashboard</h1>
      {users.map((u) => (
        <div key={u.id} className="border p-2 mb-2 rounded">
          <p><strong>Name:</strong> {u.name}</p>
          <p><strong>Email:</strong> {u.email}</p>
          <p><strong>Role:</strong> {u.role}</p>
        </div>
      ))}
      <button onClick={logout} className="mt-4 underline text-blue-600">Logout</button>
    </div>
  )
}