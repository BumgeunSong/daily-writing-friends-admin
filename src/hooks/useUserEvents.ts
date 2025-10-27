import { useQuery } from '@tanstack/react-query'
import { fetchUserEvents, fetchRecentEvents, FetchEventsOptions } from '@/apis/streak-es'

/**
 * Fetch user events with filters
 */
export function useUserEvents(uid: string | null, options: FetchEventsOptions = {}) {
  return useQuery({
    queryKey: ['userEvents', uid, options],
    queryFn: () => uid ? fetchUserEvents(uid, options) : [],
    enabled: !!uid,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Fetch recent events (last N days)
 */
export function useRecentEvents(uid: string | null, days: number = 14) {
  return useQuery({
    queryKey: ['recentEvents', uid, days],
    queryFn: () => uid ? fetchRecentEvents(uid, days) : [],
    enabled: !!uid,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
