import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getValue, fetchAndActivate } from 'firebase/remote-config'
import { remoteConfig } from '@/lib/firebase'

interface RemoteConfigValues {
  active_board_id: string
  upcoming_board_id: string
}

interface UpdateBoardsParams {
  activeBoardId: string
  upcomingBoardId: string
}

/**
 * Custom hook for managing Remote Config board settings
 */
export function useRemoteConfig() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  // Fetch config values from client-side Remote Config
  const fetchConfigValues = async (): Promise<RemoteConfigValues> => {
    try {
      // Fetch and activate latest values
      await fetchAndActivate(remoteConfig)
      
      // Get values
      const activeBoard = getValue(remoteConfig, 'active_board_id').asString()
      const upcomingBoard = getValue(remoteConfig, 'upcoming_board_id').asString()
      
      return {
        active_board_id: activeBoard,
        upcoming_board_id: upcomingBoard
      }
    } catch (error) {
      console.error('Error fetching remote config:', error)
      // Fallback to API if client-side fails
      const response = await fetch('/api/remote-config')
      if (!response.ok) {
        throw new Error('Failed to fetch remote config')
      }
      return response.json()
    }
  }

  // Query for fetching config values
  const { 
    data: configValues, 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['remoteConfig'],
    queryFn: fetchConfigValues,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000 // Auto-refetch every minute
  })

  // Mutation for updating config values
  const updateMutation = useMutation({
    mutationFn: async ({ activeBoardId, upcomingBoardId }: UpdateBoardsParams) => {
      // Client-side validation
      if (activeBoardId && upcomingBoardId && activeBoardId === upcomingBoardId) {
        throw new Error('현재 진행 중인 게시판과 다음 예정 게시판은 달라야 합니다.')
      }

      const response = await fetch('/api/remote-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active_board_id: activeBoardId,
          upcoming_board_id: upcomingBoardId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update remote config')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['remoteConfig'] })
      setError(null)
    },
    onError: (error: Error) => {
      setError(error.message)
    }
  })

  // Validation helper
  const validateBoards = (activeBoardId: string, upcomingBoardId: string): boolean => {
    if (!activeBoardId && !upcomingBoardId) return true // Both empty is valid
    if (!activeBoardId || !upcomingBoardId) return true // One empty is valid
    return activeBoardId !== upcomingBoardId // Both set must be different
  }

  return {
    // Current values
    activeBoardId: configValues?.active_board_id || '',
    upcomingBoardId: configValues?.upcoming_board_id || '',
    
    // Loading states
    isLoading,
    isUpdating: updateMutation.isPending,
    
    // Error state
    error,
    
    // Actions
    updateBoards: updateMutation.mutate,
    updateBoardsAsync: updateMutation.mutateAsync,
    refetch,
    validateBoards,
    
    // Reset error
    clearError: () => setError(null)
  }
}