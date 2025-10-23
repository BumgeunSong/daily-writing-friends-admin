'use client'

import { useParams } from 'next/navigation'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useStreakUserDetail } from '@/hooks/useStreakUserDetail'
import { useRecentEvents } from '@/hooks/useUserEvents'
import { UserDetailHeader } from '@/components/admin/streak/UserDetailHeader'
import { EventsTimeline } from '@/components/admin/streak/EventsTimeline'
import { ExplainPanel } from '@/components/admin/streak/ExplainPanel'

export default function UserDetailPage() {
  const params = useParams()
  const uid = params.uid as string

  const { data: userDetail, isLoading: isLoadingDetail, error: detailError, refetch: refetchDetail } = useStreakUserDetail(uid)
  const { data: events = [], isLoading: isLoadingEvents, error: eventsError, refetch: refetchEvents } = useRecentEvents(uid, 14)

  const isLoading = isLoadingDetail || isLoadingEvents
  const error = detailError || eventsError

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>데이터를 불러올 수 없습니다</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : '서버 오류가 발생했습니다. 나중에 다시 시도해주세요.'}
          </AlertDescription>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => refetchDetail()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              프로필 다시 로드
            </Button>
            <Button variant="outline" onClick={() => refetchEvents()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              이벤트 다시 로드
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  if (!userDetail) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>사용자를 찾을 수 없습니다</AlertTitle>
          <AlertDescription>
            해당 사용자의 연속 기록 프로젝션이 존재하지 않습니다.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <UserDetailHeader data={userDetail} />
      <EventsTimeline events={events} timezone={userDetail.profile.timezone || 'Asia/Seoul'} />
      <ExplainPanel />
    </div>
  )
}
