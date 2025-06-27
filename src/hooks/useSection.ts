import { useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  updateSection as updateSectionApi,
  deleteSection as deleteSectionApi,
  uploadSectionAudio,
  SectionUpdateData
} from '@/apis/narrations'

export function useSection(narrationId: string) {
  const queryClient = useQueryClient()

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: SectionUpdateData }) =>
      updateSectionApi(narrationId, sectionId, data),
    onSuccess: () => {
      // Invalidate sections to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['narrationSections', narrationId] })
    },
  })

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => deleteSectionApi(narrationId, sectionId),
    onSuccess: () => {
      // Invalidate sections to refetch after deletion
      queryClient.invalidateQueries({ queryKey: ['narrationSections', narrationId] })
    },
  })

  const uploadAudioMutation = useMutation({
    mutationFn: ({ sectionId, audioBlob, sectionIndex }: { 
      sectionId: string; 
      audioBlob: Blob; 
      sectionIndex: number 
    }) => uploadSectionAudio(narrationId, sectionId, audioBlob, sectionIndex),
    onSuccess: () => {
      // Invalidate sections to refetch updated storage path
      queryClient.invalidateQueries({ queryKey: ['narrationSections', narrationId] })
    },
  })

  const updateSection = async (sectionId: string, data: SectionUpdateData) => {
    await updateSectionMutation.mutateAsync({ sectionId, data })
  }

  const deleteSection = async (sectionId: string) => {
    await deleteSectionMutation.mutateAsync(sectionId)
  }

  const uploadAudio = async (sectionId: string, audioBlob: Blob, sectionIndex: number) => {
    await uploadAudioMutation.mutateAsync({ sectionId, audioBlob, sectionIndex })
  }

  return {
    updateSection,
    deleteSection,
    uploadAudio,
    isUpdating: updateSectionMutation.isPending,
    isDeleting: deleteSectionMutation.isPending,
    isUploading: uploadAudioMutation.isPending
  }
}