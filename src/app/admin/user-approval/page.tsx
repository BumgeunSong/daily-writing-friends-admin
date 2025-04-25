'use client'

import { useState } from 'react'
import { useCollection } from '@/hooks/useCollection'
import { useDocument } from '@/hooks/useDocument'
import { doc, updateDoc, getFirestore, getDoc, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore'
import { Check, UserCheck, X, Loader2, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Board, WaitingUser } from '@/types/firestore'

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

// 대기 중인 사용자 목록 조회 함수
const fetchWaitingUsers = async (board: Board | null): Promise<WaitingUser[]> => {
  if (!board || !board.waitingUsersIds || board.waitingUsersIds.length === 0) {
    return []
  }
  
  try {
    const db = getFirestore()
    const usersData: WaitingUser[] = []
    const currentCohort = board.cohort
    const previousCohort = currentCohort ? currentCohort - 1 : null

    // 각 사용자 ID에 대해 문서 가져오기
    for (const userId of board.waitingUsersIds) {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        const userData = {
          id: userDoc.id,
          ...userDoc.data(),
          previousPostsCount: null
        } as WaitingUser

        // 이전 코호트 게시글 수 조회
        if (previousCohort !== null) {
          try {
            // 이전 코호트 게시판 찾기
            const boardsRef = collection(db, 'boards')
            const boardQuery = query(boardsRef, where('cohort', '==', previousCohort))
            const boardSnapshot = await getDocs(boardQuery)
            
            if (!boardSnapshot.empty) {
              const previousBoardId = boardSnapshot.docs[0].id
              
              // 사용자의 postings 서브컬렉션에서 이전 코호트 게시글 수 계산
              const postingsRef = collection(db, 'users', userId, 'postings')
              const postingsQuery = query(postingsRef, where('board.id', '==', previousBoardId))
              const postingsSnapshot = await getDocs(postingsQuery)
              
              userData.previousPostsCount = postingsSnapshot.size
            }
          } catch (error) {
            console.error('Error fetching previous cohort posts:', error)
            userData.previousPostsCount = null
          }
        }

        usersData.push(userData)
      }
    }

    return usersData
  } catch (error) {
    console.error('Error fetching waiting users:', error)
    throw new Error('대기 중인 사용자 정보를 가져오는 중 오류가 발생했습니다.')
  }
}

export default function UserApprovalPage() {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const queryClient = useQueryClient()

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

  // 대기 중인 사용자 목록 쿼리
  const { 
    data: waitingUsers = [],
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['waitingUsers', selectedBoardId],
    queryFn: () => fetchWaitingUsers(selectedBoard || null),
    enabled: !!selectedBoard && !!selectedBoard.waitingUsersIds && selectedBoard.waitingUsersIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2분
  })

  // 사용자 승인 뮤테이션
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!selectedBoardId) throw new Error('선택된 게시판이 없습니다.')
      
      const db = getFirestore()
      
      // 1. 사용자의 boardPermissions 업데이트 - 쓰기 권한 부여
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          [`boardPermissions.${selectedBoardId}`]: 'write'
        })
      }
      
      // 2. 게시판의 waitingUsersIds 배열에서 사용자 ID 제거
      const boardRef = doc(db, 'boards', selectedBoardId)
      await updateDoc(boardRef, {
        waitingUsersIds: arrayRemove(userId)
      })
      
      return userId
    },
    onSuccess: (userId) => {
      // 캐시 데이터 업데이트
      queryClient.invalidateQueries({ queryKey: ['board', selectedBoardId] })
      
      // 대기 중인 사용자 목록에서 해당 사용자 제거
      queryClient.setQueryData(['waitingUsers', selectedBoardId], (oldData: WaitingUser[] | undefined) => {
        if (!oldData) return []
        return oldData.filter(user => user.id !== userId)
      })
      
      toast.success("사용자에게 게시판 접근 권한이 부여되었습니다.")
    },
    onError: (error) => {
      console.error('Error approving user:', error)
      toast.error("사용자 승인 처리 중 오류가 발생했습니다.")
    }
  })

  // 사용자 거부 뮤테이션
  const rejectUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!selectedBoardId) throw new Error('선택된 게시판이 없습니다.')
      
      const db = getFirestore()
      
      // 게시판의 waitingUsersIds 배열에서 사용자 ID 제거
      const boardRef = doc(db, 'boards', selectedBoardId)
      await updateDoc(boardRef, {
        waitingUsersIds: arrayRemove(userId)
      })
      
      return userId
    },
    onSuccess: (userId) => {
      // 캐시 데이터 업데이트
      queryClient.invalidateQueries({ queryKey: ['board', selectedBoardId] })
      
      // 대기 중인 사용자 목록에서 해당 사용자 제거
      queryClient.setQueryData(['waitingUsers', selectedBoardId], (oldData: WaitingUser[] | undefined) => {
        if (!oldData) return []
        return oldData.filter(user => user.id !== userId)
      })
      
      toast.success("사용자의 게시판 가입 요청이 거부되었습니다.")
    },
    onError: (error) => {
      console.error('Error rejecting user:', error)
      toast.error("사용자 거부 처리 중 오류가 발생했습니다.")
    }
  })

  const handleApproveUser = (userId: string) => {
    approveUserMutation.mutate(userId)
  }

  const handleRejectUser = (userId: string) => {
    rejectUserMutation.mutate(userId)
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
        <h1 className="text-3xl font-bold tracking-tight">신청 대기 사용자 승인</h1>
        <p className="text-muted-foreground">
          게시판 가입 신청을 관리하고 사용자 접근 권한을 설정합니다.
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
            대기 중인 사용자를 확인할 게시판을 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedBoardId || ""}
            onValueChange={(value: string) => setSelectedBoardId(value || null)}
          >
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="게시판 선택" />
            </SelectTrigger>
            <SelectContent>
              {boards && boards.length > 0 ? (
                boards.map((board) => (
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
                  대기 중인 사용자 목록
                  {selectedBoard && (
                    <span className="ml-2 text-muted-foreground font-normal text-sm">
                      ({selectedBoard.waitingUsersIds?.length || 0}명)
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedBoard?.title} 게시판 가입을 신청한 사용자 목록입니다.
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
                  {usersError instanceof Error ? usersError.message : '대기 중인 사용자 정보를 가져오는 중 오류가 발생했습니다.'}
                </AlertDescription>
              </Alert>
            ) : waitingUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>대기 중인 사용자가 없습니다.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>실명</TableHead>
                    <TableHead>닉네임</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>추천인</TableHead>
                    <TableHead>전화번호</TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center">
                            이전 코호트 게시글 수
                            <HelpCircle className="h-4 w-4 ml-1" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>코호트 {selectedBoard?.cohort ? selectedBoard.cohort - 1 : '?'}에 작성한 게시글 수</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.realName || '이름 없음'}
                      </TableCell>
                      <TableCell>{user.nickname || '닉네임 없음'}</TableCell>
                      <TableCell>{user.email || '이메일 없음'}</TableCell>
                      <TableCell>
                        {user.referrer ? (
                          user.referrer
                        ) : (
                          <span className="text-gray-400">null</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.phoneNumber ? (
                          user.phoneNumber
                        ) : (
                          <span className="text-gray-400">null</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.previousPostsCount !== null ? (
                          user.previousPostsCount
                        ) : (
                          <span className="text-gray-400">미확인</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectUser(user.id)}
                            disabled={rejectUserMutation.isPending && rejectUserMutation.variables === user.id}
                          >
                            {rejectUserMutation.isPending && rejectUserMutation.variables === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4 mr-1" />
                            )}
                            거부
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveUser(user.id)}
                            disabled={approveUserMutation.isPending && approveUserMutation.variables === user.id}
                          >
                            {approveUserMutation.isPending && approveUserMutation.variables === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            승인
                          </Button>
                        </div>
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