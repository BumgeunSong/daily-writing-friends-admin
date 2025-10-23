import { useQuery } from '@tanstack/react-query'
import { fetchUserDetailData } from '@/apis/streak-es'

/**
 * Fetch a single user's detail data (projection + profile + eventMeta)
 */
export function useStreakUserDetail(uid: string | null) {
  return useQuery({
    queryKey: ['streakUserDetail', uid],
    queryFn: () => uid ? fetchUserDetailData(uid) : null,
    enabled: !!uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
