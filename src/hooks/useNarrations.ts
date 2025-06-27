import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNarrations, createNarration as createNarrationApi } from '@/apis/narrations'

export function useNarrations() {
  const queryClient = useQueryClient()
  
  const {
    data: narrations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['narrations'],
    queryFn: fetchNarrations,
  })

  const createNarrationMutation = useMutation({
    mutationFn: ({ title, createdBy }: { title: string; createdBy: string }) =>
      createNarrationApi(title, createdBy),
    onSuccess: () => {
      // Invalidate and refetch narrations list
      queryClient.invalidateQueries({ queryKey: ['narrations'] })
    },
  })

  const createNarration = async (title: string, createdBy: string) => {
    await createNarrationMutation.mutateAsync({ title, createdBy })
  }

  return {
    narrations,
    isLoading,
    error,
    createNarration,
    refetch,
    isCreating: createNarrationMutation.isPending
  }
}