import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNarrationSections, createSection } from '@/apis/narrations'

export function useNarrationSections(narrationId: string) {
  const queryClient = useQueryClient()
  
  const {
    data: sections = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['narrationSections', narrationId],
    queryFn: () => fetchNarrationSections(narrationId),
    enabled: !!narrationId,
  })

  const addSectionMutation = useMutation({
    mutationFn: () => createSection(narrationId, sections.length),
    onSuccess: () => {
      // Invalidate and refetch sections
      queryClient.invalidateQueries({ queryKey: ['narrationSections', narrationId] })
    },
  })

  const addSection = async () => {
    await addSectionMutation.mutateAsync()
  }

  return {
    sections,
    isLoading,
    error,
    addSection,
    refetch,
    isAddingSection: addSectionMutation.isPending
  }
}