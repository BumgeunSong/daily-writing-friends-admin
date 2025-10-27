import { useQuery } from '@tanstack/react-query'
import { fetchStreakUsers } from '@/apis/streak-es'

/**
 * Fetch all users with streak projection data
 * @param activeBoardId - Optional board ID to filter only active users with write permission
 */
export function useStreakUsers(activeBoardId?: string) {
  return useQuery({
    queryKey: ['streakUsers', activeBoardId],
    queryFn: () => fetchStreakUsers(activeBoardId),
    enabled: activeBoardId !== undefined, // Only fetch when we have the board ID
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
