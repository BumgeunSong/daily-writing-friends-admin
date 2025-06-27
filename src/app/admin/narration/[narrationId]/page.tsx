'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { NarrationEditor } from '@/components/admin/narration/NarrationEditor'
import { useNarration } from '@/hooks/useNarration'

export default function NarrationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const narrationId = params.narrationId as string
  
  const { narration, isLoading } = useNarration(narrationId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-muted rounded animate-pulse"></div>
          <div className="h-32 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!narration) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/narration')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">내레이션을 찾을 수 없습니다</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/narration')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{narration.title}</h1>
      </div>
      
      <NarrationEditor narrationId={narrationId} />
    </div>
  )
}