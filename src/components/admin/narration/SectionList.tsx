'use client'

import { NarrationSection } from '@/types/firestore'
import { SectionCard } from './SectionCard'

interface SectionListProps {
  narrationId: string
  sections: NarrationSection[]
}

export function SectionList({ narrationId, sections }: SectionListProps) {
  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <SectionCard
          key={section.id}
          narrationId={narrationId}
          section={section}
          sectionIndex={index}
        />
      ))}
    </div>
  )
}