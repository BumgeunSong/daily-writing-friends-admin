'use client'

import { ArrowLeft, ExternalLink, Copy, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { UserDetailData } from '@/types/firestore'
import { UserStatusBadge } from './UserStatusBadge'
import { formatTsInTz } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface UserDetailHeaderProps {
  data: UserDetailData
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function UserDetailHeader({ data, onRefresh, isRefreshing = false }: UserDetailHeaderProps) {
  const { uid, profile, projection } = data

  const handleCopyUid = () => {
    navigator.clipboard.writeText(uid)
    toast.success('UID가 복사되었습니다')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/streak-monitor">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  목록으로
                </Link>
              </Button>
            </div>
            <CardTitle className="text-2xl">
              {profile.displayName || profile.email || 'Unknown User'}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span>{profile.email}</span>
              <span>·</span>
              <span className="font-mono text-xs">{uid}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={handleCopyUid}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
            )}
            <Button variant="outline" asChild>
              <a
                href={`https://dailywritingfriends.com/user/${uid}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                앱에서 보기
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Status */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">상태</div>
            <div className="flex items-center gap-2">
              <UserStatusBadge
                status={projection.status}
                timezone={profile.timezone || 'Asia/Seoul'}
              />
            </div>
            {projection.status.type === 'eligible' && (
              <div className="mt-2 text-sm text-muted-foreground">
                <div>작성 진행: {projection.status.currentPosts}/{projection.status.postsRequired}</div>
                <div>마감: {formatTsInTz(projection.status.deadline, profile.timezone || 'Asia/Seoul')}</div>
              </div>
            )}
            {projection.status.type === 'missed' && (
              <div className="mt-2 text-sm text-destructive">
                놓친 날짜: {projection.status.missedDate}
              </div>
            )}
          </div>

          {/* Streaks */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">연속 기록</div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">현재:</span>{' '}
                <span className="font-semibold text-lg">{projection.currentStreak}</span>일
              </div>
              <div>
                <span className="text-muted-foreground">원본:</span>{' '}
                <span className="font-medium">{projection.originalStreak}</span>일
              </div>
              <div>
                <span className="text-muted-foreground">최장:</span>{' '}
                <span className="font-medium">{projection.longestStreak}</span>일
              </div>
            </div>
          </div>

          {/* User Info */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">사용자 정보</div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">타임존:</span>{' '}
                <span className="font-medium">{profile.timezone || 'Asia/Seoul'}</span>
              </div>
            </div>
          </div>

          {/* Projection metadata */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">프로젝션 메타데이터</div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">적용된 Seq:</span>{' '}
                <span className="font-medium">{projection.appliedSeq}</span>
              </div>
              {projection.lastEvaluatedDayKey && (
                <div>
                  <span className="text-muted-foreground">마지막 평가일:</span>{' '}
                  <span className="font-medium">{projection.lastEvaluatedDayKey}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">프로젝터 버전:</span>{' '}
                <span className="font-mono text-xs">{projection.projectorVersion}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
