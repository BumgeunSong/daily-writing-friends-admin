'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { SectionList } from './SectionList'
import { useNarrationSections } from '@/hooks/useNarrationSections'

interface NarrationEditorProps {
  narrationId: string
}

export function NarrationEditor({ narrationId }: NarrationEditorProps) {
  const { sections, isLoading, addSection, isAddingSection } = useNarrationSections(narrationId)

  const handleAddSection = async () => {
    try {
      await addSection()
    } catch (error) {
      console.error('Failed to add section:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-24 bg-muted rounded w-full"></div>
              <div className="flex gap-2">
                <div className="h-10 bg-muted rounded w-20"></div>
                <div className="h-10 bg-muted rounded w-20"></div>
                <div className="h-10 bg-muted rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">섹션 관리</h2>
        <Button onClick={handleAddSection} disabled={isAddingSection}>
          <Plus className="mr-2 h-4 w-4" />
          {isAddingSection ? '추가 중...' : '섹션 추가'}
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">아직 섹션이 없습니다.</p>
          <Button onClick={handleAddSection} variant="outline" disabled={isAddingSection}>
            <Plus className="mr-2 h-4 w-4" />
            {isAddingSection ? '추가 중...' : '첫 번째 섹션 추가'}
          </Button>
        </div>
      ) : (
        <SectionList narrationId={narrationId} sections={sections} />
      )}
    </div>
  )
}