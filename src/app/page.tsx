'use client'

import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, login, logout, loading } = useAuth()

  if (loading) return <p>Loading...</p>

  if (!user) {
    return (
      <div className="p-4">
        <button onClick={login}>Sign in with Google</button>
      </div>
    )
  }

  // Replace with real admin check (we’ll do that in the next step)
  const isAdmin = user.email === 'your@email.com'
  if (!isAdmin) {
    return (
      <div className="p-4">
        <p>Access denied</p>
        <button onClick={logout}>Logout</button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <p>Welcome, {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}