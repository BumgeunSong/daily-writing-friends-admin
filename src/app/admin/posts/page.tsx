'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, getFirestore, Timestamp } from 'firebase/firestore'
import { Copy, Loader2, AlertCircle, RefreshCw, FileText } from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { 
  useQuery, 
  useQueryClient 
} from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Board, Post } from '@/types/firestore'

// 게시판 목록 조회 함수
const fetchBoards = async (): Promise<Board[]> => {
  try {
    const db = getFirestore()
    const boardsRef = collection(db, 'boards')
    const snapshot = await getDocs(boardsRef)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Board))
  } catch (error) {
    console.error('Error fetching boards:', error)
    throw new Error('게시판 목록을 가져오는 중 오류가 발생했습니다.')
  }
}

// 주의 시작일(월요일)과 종료일(일요일) 계산
const getWeekRange = () => {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = 일요일, 1 = 월요일, ...
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  monday.setHours(0, 0, 0, 0)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  return { monday, sunday }
}

// 게시물 목록 조회 함수
const fetchPosts = async (boardId: string | null, dateRange: 'week' | 'all'): Promise<Post[]> => {
  if (!boardId) return []
  
  try {
    const db = getFirestore()
    const postsRef = collection(db, 'boards', boardId, 'posts')
    
    let postsQuery
    if (dateRange === 'week') {
      const { monday, sunday } = getWeekRange()
      postsQuery = query(
        postsRef,
        where('createdAt', '>=', Timestamp.fromDate(monday)),
        where('createdAt', '<=', Timestamp.fromDate(sunday))
      )
    } else {
      postsQuery = query(postsRef)
    }
    
    const snapshot = await getDocs(postsQuery)
    
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Post))
    
    // 총 참여도(댓글 + 답글) 기준 내림차순 정렬
    return posts.sort((a, b) => {
      const engagementA = (a.countOfComments || 0) + (a.countOfReplies || 0)
      const engagementB = (b.countOfComments || 0) + (b.countOfReplies || 0)
      return engagementB - engagementA
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    throw new Error('게시물 목록을 가져오는 중 오류가 발생했습니다.')
  }
}

export default function PostsPage() {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'week' | 'all'>('all')
  const queryClient = useQueryClient()

  // 로컬 스토리지에서 이전에 선택한 게시판 ID 불러오기
  useEffect(() => {
    const storedBoardId = localStorage.getItem('adminPosts_selectedBoardId')
    const storedDateRange = localStorage.getItem('adminPosts_dateRange') as 'week' | 'all'
    
    if (storedBoardId) {
      setSelectedBoardId(storedBoardId)
    }
    if (storedDateRange) {
      setDateRange(storedDateRange)
    }
  }, [])

  // 선택한 게시판 ID를 로컬 스토리지에 저장
  const handleBoardSelection = (value: string) => {
    const boardId = value || null
    setSelectedBoardId(boardId)
    
    if (boardId) {
      localStorage.setItem('adminPosts_selectedBoardId', boardId)
    } else {
      localStorage.removeItem('adminPosts_selectedBoardId')
    }
  }

  // 날짜 범위 변경 핸들러
  const handleDateRangeChange = (value: 'week' | 'all') => {
    setDateRange(value)
    localStorage.setItem('adminPosts_dateRange', value)
  }

  // 게시물 URL 복사 함수
  const copyPostUrl = (boardId: string, postId: string) => {
    const url = `${window.location.origin}/boards/${boardId}/posts/${postId}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success("게시물 링크가 복사되었습니다.")
    }).catch(() => {
      toast.error("링크 복사 중 오류가 발생했습니다.")
    })
  }

  // 게시판 목록 쿼리
  const { 
    data: boards, 
    isLoading: boardsLoading, 
    error: boardsError 
  } = useQuery({
    queryKey: ['boards'],
    queryFn: fetchBoards,
    staleTime: 5 * 60 * 1000, // 5분
  })

  // 게시물 목록 쿼리
  const { 
    data: posts = [],
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['posts', selectedBoardId, dateRange],
    queryFn: () => fetchPosts(selectedBoardId, dateRange),
    enabled: !!selectedBoardId,
    staleTime: 2 * 60 * 1000, // 2분
  })

  const selectedBoard = boards?.find(board => board.id === selectedBoardId)

  if (boardsLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (boardsError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>게시판 목록을 불러올 수 없습니다</AlertTitle>
        <AlertDescription>
          {boardsError instanceof Error ? boardsError.message : '서버 오류가 발생했습니다. 나중에 다시 시도해주세요.'}
        </AlertDescription>
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['boards'] })}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
        </div>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">게시물 관리</h1>
        <p className="text-muted-foreground">
          게시판별 게시물을 조회하고 참여도를 확인합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>필터 설정</CardTitle>
          <CardDescription>
            게시물을 조회할 게시판과 기간을 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">게시판 선택</label>
              <Select
                value={selectedBoardId || ""}
                onValueChange={handleBoardSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="게시판 선택" />
                </SelectTrigger>
                <SelectContent>
                  {boards && boards.length > 0 ? (
                    [...boards]
                      .sort((a, b) => {
                        // 코호트 번호 기준 내림차순 정렬 (높은 번호 -> 낮은 번호)
                        const cohortA = a.cohort || 0;
                        const cohortB = b.cohort || 0;
                        return cohortB - cohortA;
                      })
                      .map((board) => (
                        <SelectItem key={board.id} value={board.id}>
                          {board.title} {board.cohort ? `(코호트 ${board.cohort})` : ''}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="none" disabled>
                      게시판이 없습니다
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">기간 선택</label>
              <Select
                value={dateRange}
                onValueChange={handleDateRangeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 게시물</SelectItem>
                  <SelectItem value="week">이번 주 (월-일)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedBoardId && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  게시물 목록
                  <span className="ml-2 text-muted-foreground font-normal text-sm">
                    ({posts.length}개)
                  </span>
                </CardTitle>
                <CardDescription>
                  {selectedBoard?.title} 게시판의 게시물 목록입니다. 
                  {dateRange === 'week' && ' (이번 주 게시물만 표시)'}
                </CardDescription>
              </div>
              {postsError && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetchPosts()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  새로고침
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {postsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">게시물을 불러오는 중...</span>
              </div>
            ) : postsError ? (
              <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>게시물을 불러올 수 없습니다</AlertTitle>
                <AlertDescription>
                  {postsError instanceof Error ? postsError.message : '게시물 정보를 가져오는 중 오류가 발생했습니다.'}
                </AlertDescription>
              </Alert>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>
                  {dateRange === 'week' 
                    ? '이번 주에 작성된 게시물이 없습니다.'
                    : '게시물이 없습니다.'
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">순위</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>작성자</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead className="text-center">댓글</TableHead>
                    <TableHead className="text-center">답글</TableHead>
                    <TableHead className="text-center">총 참여도</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post, index) => {
                    const totalEngagement = (post.countOfComments || 0) + (post.countOfReplies || 0)
                    const createdAt = post.createdAt 
                      ? (post.createdAt instanceof Timestamp 
                          ? post.createdAt.toDate() 
                          : new Date(post.createdAt))
                      : null
                    
                    return (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium text-center">
                          {index + 1}
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="truncate font-medium">
                            {post.title || '제목 없음'}
                          </div>
                          {post.thumbnailImageURL && (
                            <div className="text-xs text-muted-foreground mt-1">
                              📷 이미지 첨부
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {post.authorName || '작성자 없음'}
                        </TableCell>
                        <TableCell>
                          {createdAt ? (
                            <div>
                              <div className="text-sm">
                                {createdAt.toLocaleDateString('ko-KR')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {createdAt.toLocaleTimeString('ko-KR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">날짜 없음</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {post.countOfComments || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          {post.countOfReplies || 0}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {totalEngagement}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyPostUrl(selectedBoardId, post.id)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            링크 복사
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="border-t px-6 py-3">
            <div className="text-xs text-muted-foreground">
              마지막 업데이트: {new Date().toLocaleString('ko-KR')}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
} 