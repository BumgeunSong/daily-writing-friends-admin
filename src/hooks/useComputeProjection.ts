import { useMutation, useQueryClient } from '@tanstack/react-query'
import { computeProjection } from '@/apis/streak-es'
import { toast } from 'sonner'

/**
 * Hook for manually refreshing a user's projection via compute endpoint
 * Used for per-row refresh buttons in the table
 */
export function useComputeProjection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uid: string) => computeProjection(uid),
    onSuccess: (data, uid) => {
      toast.success('프로젝션이 새로고침되었습니다')
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['streakUsers'] })
      queryClient.invalidateQueries({ queryKey: ['streakUserDetail', uid] })
    },
    onError: (error: Error) => {
      toast.error(`새로고침 실패: ${error.message}`)
    }
  })
}
