'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useStreakUsers } from '@/hooks/useStreakUsers'
import { useRemoteConfigValue } from '@/hooks/useRemoteConfig'
import { UsersOverviewTable } from '@/components/admin/streak/UsersOverviewTable'

export default function StreakMonitorPage() {
  // Get active board ID from remote config
  const { value: activeBoardId, isLoading: isLoadingConfig } = useRemoteConfigValue('active_board_id')

  // Fetch only active users (users with write permission to active board)
  const { data: users = [], isLoading: isLoadingUsers, error, refetch } = useStreakUsers(activeBoardId)

  const isLoading = isLoadingConfig || isLoadingUsers

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-10 w-1/3 mb-2" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Streak Monitor (Phase 2)</h1>
          <p className="text-muted-foreground">
            사용자들의 연속 기록 상태를 모니터링합니다
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>데이터를 불러올 수 없습니다</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : '서버 오류가 발생했습니다. 나중에 다시 시도해주세요.'}
          </AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Streak Monitor (Phase 2)</h1>
        <p className="text-muted-foreground">
          사용자들의 연속 기록 상태를 모니터링합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>활성 사용자 개요</CardTitle>
          <CardDescription>
            현재 활성 게시판에 참여 중인 사용자들의 연속 기록 상태
            {activeBoardId && <span className="ml-2 text-xs opacity-70">(게시판 ID: {activeBoardId})</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!activeBoardId ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>활성 게시판이 설정되지 않았습니다</p>
              <p className="text-sm mt-2">Remote Config에서 active_board_id를 설정해주세요</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>활성 게시판에 참여 중인 사용자가 없습니다</p>
            </div>
          ) : (
            <UsersOverviewTable users={users} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
