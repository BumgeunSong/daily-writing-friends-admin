'use client'

import { useState, useMemo } from 'react'
import { Event, EventType } from '@/types/firestore'
import { formatTsInTz } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface EventsTimelineProps {
  events: Event[]
  timezone?: string
}

const EVENT_TYPES: EventType[] = ['PostCreated', 'PostDeleted', 'TimezoneChanged', 'DayClosed']

export function EventsTimeline({ events, timezone = 'Asia/Seoul' }: EventsTimelineProps) {
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<Set<EventType>>(new Set(EVENT_TYPES))
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // Get timezone abbreviation for display
  const getTimezoneAbbreviation = (tz: string): string => {
    try {
      const date = new Date()
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'short'
      })
      const parts = formatter.formatToParts(date)
      const tzPart = parts.find(part => part.type === 'timeZoneName')
      return tzPart?.value || tz
    } catch {
      return tz
    }
  }

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Toggle event type filter
  const toggleEventType = (type: EventType) => {
    const newSet = new Set(selectedTypes)
    if (newSet.has(type)) {
      newSet.delete(type)
    } else {
      newSet.add(type)
    }
    setSelectedTypes(newSet)
    setCurrentPage(1) // Reset to first page
  }

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events.filter(e => selectedTypes.has(e.type))

    // Sort
    filtered.sort((a, b) => {
      const seqDiff = sortOrder === 'newest' ? b.seq - a.seq : a.seq - b.seq
      return seqDiff
    })

    return filtered
  }, [events, selectedTypes, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEvents.length / itemsPerPage)
  const paginatedEvents = filteredAndSortedEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Get event type badge variant
  const getEventTypeBadgeVariant = (type: EventType) => {
    switch (type) {
      case 'PostCreated':
        return 'default'
      case 'PostDeleted':
        return 'destructive'
      case 'TimezoneChanged':
        return 'secondary'
      case 'DayClosed':
        return 'outline'
      default:
        return 'outline'
    }
  }

  // Format payload for display
  const formatPayload = (event: Event): string => {
    if (!event.payload) return '-'

    try {
      // For PostCreated/PostDeleted, show postId
      if (event.type === 'PostCreated' || event.type === 'PostDeleted') {
        const postId = event.payload.postId as string | undefined
        return postId ? `postId: ${postId}` : '-'
      }

      // For TimezoneChanged, show old and new timezone
      if (event.type === 'TimezoneChanged') {
        const oldTz = event.payload.oldTimezone as string | undefined
        const newTz = event.payload.newTimezone as string | undefined
        return `${oldTz || '?'} → ${newTz || '?'}`
      }

      // Default: show JSON
      return JSON.stringify(event.payload)
    } catch {
      return '-'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>이벤트 타임라인</CardTitle>
            <CardDescription>
              사용자의 이벤트 스트림 ({filteredAndSortedEvents.length}개 이벤트)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={sortOrder === 'newest' ? 'default' : 'outline'}
              onClick={() => setSortOrder('newest')}
            >
              최신순
            </Button>
            <Button
              size="sm"
              variant={sortOrder === 'oldest' ? 'default' : 'outline'}
              onClick={() => setSortOrder('oldest')}
            >
              오래된순
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event type filters */}
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map(type => (
            <Badge
              key={type}
              variant={selectedTypes.has(type) ? getEventTypeBadgeVariant(type) : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleEventType(type)}
            >
              {type}
            </Badge>
          ))}
        </div>

        {/* Events table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Seq</TableHead>
                <TableHead className="w-[140px]">타입</TableHead>
                <TableHead className="w-[120px]">dayKey</TableHead>
                <TableHead>생성 시각 ({getTimezoneAbbreviation(timezone)})</TableHead>
                <TableHead>상세</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    필터된 이벤트가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-mono text-xs">{event.seq}</TableCell>
                    <TableCell>
                      <Badge variant={getEventTypeBadgeVariant(event.type)}>
                        {event.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{event.dayKey}</TableCell>
                    <TableCell className="text-sm">
                      {formatTsInTz(event.createdAt, timezone)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatPayload(event)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              페이지 {currentPage} / {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                이전
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
