'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useExplainProjection } from '@/hooks/useExplainProjection'
import { EventExplanation } from '@/types/firestore'
import { AlertCircle, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export function ExplainPanel() {
  const params = useParams()
  const uid = params?.uid as string
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useExplainProjection(uid)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())

  const handleRefresh = async () => {
    await refetch()
    // Invalidate detail data cache to show fresh projection
    queryClient.invalidateQueries({ queryKey: ['streakUserDetail', uid] })
  }

  const toggleStep = (seq: number) => {
    const newSet = new Set(expandedSteps)
    if (newSet.has(seq)) {
      newSet.delete(seq)
    } else {
      newSet.add(seq)
    }
    setExpandedSteps(newSet)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'onStreak':
        return 'default'
      case 'eligible':
        return 'secondary'
      case 'missed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getEventTypeBadgeVariant = (type: string, isVirtual: boolean) => {
    if (isVirtual) return 'outline'
    switch (type) {
      case 'PostCreated':
        return 'default'
      case 'PostDeleted':
        return 'destructive'
      case 'TimezoneChanged':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Explain Reducer</CardTitle>
          <CardDescription>이벤트 스트림 분석</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : '설명을 불러올 수 없습니다'}
            </AlertDescription>
          </Alert>
          <Button
            className="mt-4"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Explain Reducer</CardTitle>
            <CardDescription>
              이벤트 스트림 상태 변화 분석 ({data.summary.totalEvents}개 이벤트, {data.summary.virtualClosures}개 가상 DayClosed)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Total Events</div>
            <div className="text-2xl font-bold">{data.summary.totalEvents}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Virtual Closures</div>
            <div className="text-2xl font-bold">{data.summary.virtualClosures}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Status Changes</div>
            <div className="text-2xl font-bold">{data.summary.statusTransitions}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Streak Changes</div>
            <div className="text-2xl font-bold">{data.summary.streakChanges}</div>
          </div>
        </div>

        {/* Event Explanations */}
        <div className="space-y-2">
          {data.eventExplanations.map((explanation: EventExplanation, index: number) => {
            const isExpanded = expandedSteps.has(explanation.seq)
            const hasChanges = explanation.changes.length > 0

            return (
              <Collapsible
                key={`${explanation.seq}-${explanation.dayKey}-${index}`}
                open={isExpanded}
                onOpenChange={() => toggleStep(explanation.seq)}
              >
                <div
                  className={`border rounded-lg ${
                    hasChanges ? 'border-l-4 border-l-primary' : ''
                  }`}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">
                            #{explanation.seq}
                          </span>
                          <Badge variant={getEventTypeBadgeVariant(explanation.type, explanation.isVirtual)}>
                            {explanation.isVirtual ? '🔹 ' : ''}{explanation.type}
                          </Badge>
                          <span className="font-mono text-sm">{explanation.dayKey}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(explanation.stateBefore.status)}>
                            {explanation.stateBefore.status}
                          </Badge>
                          {hasChanges && (
                            <>
                              <span>→</span>
                              <Badge variant={getStatusBadgeVariant(explanation.stateAfter.status)}>
                                {explanation.stateAfter.status}
                              </Badge>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Streak: {explanation.stateBefore.currentStreak} → {explanation.stateAfter.currentStreak}
                        </div>
                      </div>
                      {hasChanges && (
                        <Badge variant="outline">{explanation.changes.length} changes</Badge>
                      )}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-3">
                      {/* Changes */}
                      {explanation.changes.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Changes:</div>
                          {explanation.changes.map((change, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-muted/30 rounded text-sm space-y-1"
                            >
                              <div className="font-medium text-primary">{change.field}</div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <span>{formatValue(change.before)}</span>
                                <span>→</span>
                                <span className="text-foreground font-medium">{formatValue(change.after)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground italic">
                                {change.reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* State Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium mb-2">State Before:</div>
                          <div className="space-y-1 text-muted-foreground">
                            <div>Status: {explanation.stateBefore.status}</div>
                            <div>Current Streak: {explanation.stateBefore.currentStreak}</div>
                            <div>Original Streak: {explanation.stateBefore.originalStreak}</div>
                            <div>Longest Streak: {explanation.stateBefore.longestStreak}</div>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium mb-2">State After:</div>
                          <div className="space-y-1 text-muted-foreground">
                            <div>Status: {explanation.stateAfter.status}</div>
                            <div>Current Streak: {explanation.stateAfter.currentStreak}</div>
                            <div>Original Streak: {explanation.stateAfter.originalStreak}</div>
                            <div>Longest Streak: {explanation.stateAfter.longestStreak}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
