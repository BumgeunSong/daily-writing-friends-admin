'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, getFirestore, doc, getDoc } from 'firebase/firestore'
import { Loader2, AlertCircle, RefreshCw, UserX } from 'lucide-react'
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
import { 
  useQuery, 
  useQueryClient 
} from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Board, User } from '@/types/firestore'

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

// 선택한 게시판 조회 함수
const fetchBoard = async (boardId: string | null): Promise<Board | null> => {
  if (!boardId) return null
  
  try {
    const db = getFirestore()
    const boardRef = doc(db, 'boards', boardId)
    const boardDoc = await getDoc(boardRef)
    
    if (boardDoc.exists()) {
      return {
        id: boardDoc.id,
        ...boardDoc.data()
      } as Board
    }
    return null
  } catch (error) {
    console.error('Error fetching board:', error)
    throw new Error('게시판 정보를 가져오는 중 오류가 발생했습니다.')
  }
}

// 이탈 사용자 목록 조회 함수
const fetchChurningUsers = async (board: Board | null): Promise<User[]> => {
  if (!board) return []
  
  try {
    const db = getFirestore()
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    
    const allUsers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User))
    
    // 이탈 사용자 필터링: 대기 목록에도 없고 권한도 없는 사용자
    const churningUsers = allUsers.filter(user => {
      // 대기 목록에 있는 사용자 제외
      const isInWaitingList = board.waitingUsersIds?.includes(user.id) || false
      
      // 해당 게시판에 대한 권한이 있는 사용자 제외
      const hasPermission = user.boardPermissions && user.boardPermissions[board.id]
      
      // 둘 다 해당하지 않는 사용자만 이탈 사용자로 분류
      return !isInWaitingList && !hasPermission
    })
    
    return churningUsers
  } catch (error) {
    console.error('Error fetching churning users:', error)
    throw new Error('이탈 사용자 정보를 가져오는 중 오류가 발생했습니다.')
  }
}

export default function UserChurnPage() {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // 로컬 스토리지에서 이전에 선택한 게시판 ID 불러오기
  useEffect(() => {
    const storedBoardId = localStorage.getItem('adminUserChurn_selectedBoardId')
    if (storedBoardId) {
      setSelectedBoardId(storedBoardId)
    }
  }, [])

  // 선택한 게시판 ID를 로컬 스토리지에 저장
  const handleBoardSelection = (value: string) => {
    const boardId = value || null
    setSelectedBoardId(boardId)
    
    if (boardId) {
      localStorage.setItem('adminUserChurn_selectedBoardId', boardId)
    } else {
      localStorage.removeItem('adminUserChurn_selectedBoardId')
    }
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

  // 선택된 게시판 쿼리
  const { 
    data: selectedBoard,
    isLoading: boardLoading,
    error: boardError
  } = useQuery({
    queryKey: ['board', selectedBoardId],
    queryFn: () => fetchBoard(selectedBoardId),
    enabled: !!selectedBoardId,
    staleTime: 5 * 60 * 1000, // 5분
  })

  // 이탈 사용자 목록 쿼리
  const { 
    data: churningUsers = [],
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['churningUsers', selectedBoardId],
    queryFn: () => fetchChurningUsers(selectedBoard || null),
    enabled: !!selectedBoard,
    staleTime: 2 * 60 * 1000, // 2분
  })

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
        <h1 className="text-3xl font-bold tracking-tight">이탈 유저 관리</h1>
        <p className="text-muted-foreground">
          선택한 게시판에 참여하지 않은 이탈 사용자를 확인합니다.
        </p>
      </div>

      {boardError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>게시판 정보를 불러올 수 없습니다</AlertTitle>
          <AlertDescription>
            {boardError instanceof Error ? boardError.message : '선택한 게시판의 정보를 가져오는 중 오류가 발생했습니다.'}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>게시판 선택</CardTitle>
          <CardDescription>
            이탈 사용자를 확인할 게시판을 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedBoardId || ""}
            onValueChange={handleBoardSelection}
          >
            <SelectTrigger className="w-full sm:w-[300px]">
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
        </CardContent>
      </Card>

      {selectedBoardId && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  이탈 사용자 목록
                  <span className="ml-2 text-muted-foreground font-normal text-sm">
                    ({churningUsers.length}명)
                  </span>
                </CardTitle>
                <CardDescription>
                  {selectedBoard?.title} 게시판에 참여하지 않은 사용자 목록입니다.
                </CardDescription>
              </div>
              {usersError && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetchUsers()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  새로고침
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {boardLoading || usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">사용자 정보를 불러오는 중...</span>
              </div>
            ) : usersError ? (
              <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>사용자 정보를 불러올 수 없습니다</AlertTitle>
                <AlertDescription>
                  {usersError instanceof Error ? usersError.message : '이탈 사용자 정보를 가져오는 중 오류가 발생했습니다.'}
                </AlertDescription>
              </Alert>
            ) : churningUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserX className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>이탈한 사용자가 없습니다.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>실명</TableHead>
                    <TableHead>닉네임</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>전화번호</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {churningUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.realName || '이름 없음'}
                      </TableCell>
                      <TableCell>{user.nickname || '닉네임 없음'}</TableCell>
                      <TableCell>{user.email || '이메일 없음'}</TableCell>
                      <TableCell>
                        {user.phoneNumber ? (
                          user.phoneNumber
                        ) : (
                          <span className="text-gray-400">null</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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