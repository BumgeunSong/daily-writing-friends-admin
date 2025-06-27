import { useQuery } from '@tanstack/react-query'
import { fetchNarration } from '@/apis/narrations'

export function useNarration(narrationId: string) {
  const {
    data: narration,
    isLoading,
    error
  } = useQuery({
    queryKey: ['narration', narrationId],
    queryFn: () => fetchNarration(narrationId),
    enabled: !!narrationId,
  })
  
  return {
    narration,
    isLoading,
    error
  }
}