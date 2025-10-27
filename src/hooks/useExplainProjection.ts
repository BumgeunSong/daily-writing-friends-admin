import { useQuery } from '@tanstack/react-query'
import { explainUserStreakProjection, ExplainProjectionOptions } from '@/apis/streak-es'

/**
 * Hook to fetch explanation of user streak projection
 */
export function useExplainProjection(uid: string, options: ExplainProjectionOptions = {}) {
  return useQuery({
    queryKey: ['explainProjection', uid, options],
    queryFn: () => explainUserStreakProjection(uid, options),
    enabled: !!uid,
    staleTime: 1 * 60 * 1000, // 1 minute - explanations are relatively static
  })
}
