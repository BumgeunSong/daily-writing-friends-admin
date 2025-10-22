'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ExternalLink, Eye } from 'lucide-react'
import { StreakUserRow } from '@/types/firestore'
import { UserStatusBadge } from './UserStatusBadge'
import { calculateProjectionLag } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface UsersOverviewTableProps {
  users: StreakUserRow[]
}

type SortField = 'currentStreak' | 'longestStreak' | 'lastContributionDate'
type SortDirection = 'asc' | 'desc'

export function UsersOverviewTable({ users }: UsersOverviewTableProps) {
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [timezoneFilter, setTimezoneFilter] = useState<string>('all')
  const [laggingOnly, setLaggingOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Sort states
  const [sortField, setSortField] = useState<SortField>('currentStreak')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  // Get unique timezones
  const timezones = useMemo(() => {
    const tzSet = new Set(users.map(u => u.timezone))
    return Array.from(tzSet).sort()
  }, [users])

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status.type === statusFilter)
    }

    // Timezone filter
    if (timezoneFilter !== 'all') {
      filtered = filtered.filter(u => u.timezone === timezoneFilter)
    }

    // Lagging only filter
    if (laggingOnly) {
      filtered = filtered.filter(u => u.latestSeq !== null && u.appliedSeq < u.latestSeq)
    }

    // Search filter (name or email)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(u =>
        u.displayName?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.uid.toLowerCase().includes(query)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: number | string | null
      let bVal: number | string | null

      if (sortField === 'currentStreak') {
        aVal = a.currentStreak
        bVal = b.currentStreak
      } else if (sortField === 'longestStreak') {
        aVal = a.longestStreak
        bVal = b.longestStreak
      } else {
        aVal = a.lastContributionDate || ''
        bVal = b.lastContributionDate || ''
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [users, statusFilter, timezoneFilter, laggingOnly, searchQuery, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search">검색</Label>
          <Input
            id="search"
            placeholder="이름, 이메일, UID 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="min-w-[150px]">
          <Label htmlFor="status-filter">상태</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="onStreak">연속 중</SelectItem>
              <SelectItem value="eligible">작성 가능</SelectItem>
              <SelectItem value="missed">놓침</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[150px]">
          <Label htmlFor="timezone-filter">타임존</Label>
          <Select value={timezoneFilter} onValueChange={setTimezoneFilter}>
            <SelectTrigger id="timezone-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {timezones.map(tz => (
                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="lagging"
            checked={laggingOnly}
            onCheckedChange={(checked) => setLaggingOnly(checked as boolean)}
          />
          <Label htmlFor="lagging">지연 중만 보기</Label>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredAndSortedUsers.length}명의 사용자 (총 {users.length}명)
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>사용자</TableHead>
              <TableHead>타임존</TableHead>
              <TableHead>상태</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort('currentStreak')}
              >
                현재 연속{getSortIndicator('currentStreak')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort('longestStreak')}
              >
                최장 연속{getSortIndicator('longestStreak')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort('lastContributionDate')}
              >
                마지막 기여{getSortIndicator('lastContributionDate')}
              </TableHead>
              <TableHead>동기화 상태</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  검색 결과가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="font-medium cursor-help">
                            {user.displayName || user.email || 'Unknown'}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>UID: {user.uid}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.timezone}
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge status={user.status} timezone={user.timezone} />
                  </TableCell>
                  <TableCell>{user.currentStreak}</TableCell>
                  <TableCell>{user.longestStreak}</TableCell>
                  <TableCell>
                    {user.lastContributionDate || '-'}
                  </TableCell>
                  <TableCell>
                    <span className={
                      user.latestSeq !== null && user.appliedSeq < user.latestSeq
                        ? 'text-destructive font-medium'
                        : 'text-muted-foreground'
                    }>
                      {calculateProjectionLag(user.appliedSeq, user.latestSeq)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a
                          href={`https://dailywritingfriends.com/user/${user.uid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          앱에서 보기
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        asChild
                      >
                        <Link href={`/admin/streak-monitor/${user.uid}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          상세
                        </Link>
                      </Button>
                    </div>
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
    </div>
  )
}
