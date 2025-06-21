'use client'

import { collection, getDocs, getFirestore, Timestamp } from 'firebase/firestore'
import { Eye, AlertCircle, RefreshCw, Newspaper } from 'lucide-react'
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
  useQuery, 
  useQueryClient 
} from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Board } from '@/types/firestore'
import { useRouter } from 'next/navigation'

// 게시판 목록 조회 함수
const fetchBoards = async (): Promise<Board[]> => {
  try {
    const db = getFirestore()
    const boardsRef = collection(db, 'boards')
    const snapshot = await getDocs(boardsRef)
    
    const boards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Board))
    
    // 코호트 번호 기준 내림차순 정렬 (높은 번호 -> 낮은 번호)
    return boards.sort((a, b) => {
      const cohortA = a.cohort || 0
      const cohortB = b.cohort || 0
      return cohortB - cohortA
    })
  } catch (error) {
    console.error('Error fetching boards:', error)
    throw new Error('게시판 목록을 가져오는 중 오류가 발생했습니다.')
  }
}

export default function BoardsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // 게시판 목록 쿼리
  const { 
    data: boards = [], 
    isLoading: boardsLoading, 
    error: boardsError 
  } = useQuery({
    queryKey: ['boards'],
    queryFn: fetchBoards,
    staleTime: 5 * 60 * 1000, // 5분
  })

  // 게시판 상세 페이지로 이동
  const handleViewBoard = (boardId: string) => {
    router.push(`/admin/boards/${boardId}`)
  }

  if (boardsLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
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
        <h1 className="text-3xl font-bold tracking-tight">게시판 관리</h1>
        <p className="text-muted-foreground">
          모든 게시판을 조회하고 관리합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                게시판 목록
                <span className="ml-2 text-muted-foreground font-normal text-sm">
                  ({boards.length}개)
                </span>
              </CardTitle>
              <CardDescription>
                코호트별로 정렬된 게시판 목록입니다.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {boards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Newspaper className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>등록된 게시판이 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">코호트</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>시작일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boards.map((board) => {
                  const firstDay = board.firstDay 
                    ? (board.firstDay instanceof Timestamp 
                        ? board.firstDay.toDate() 
                        : new Date(board.firstDay))
                    : null
                  
                  return (
                    <TableRow key={board.id}>
                      <TableCell className="font-medium text-center">
                        {board.cohort ? (
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {board.cohort}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {board.title}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="truncate text-muted-foreground">
                          {board.description || '설명 없음'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {firstDay ? (
                          <div>
                            <div className="text-sm">
                              {firstDay.toLocaleDateString('ko-KR')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {firstDay.toLocaleDateString('ko-KR', { 
                                weekday: 'short'
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">날짜 없음</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewBoard(board.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          상세보기
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
    </div>
  )
} 