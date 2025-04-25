'use client'

import { useCollection } from '@/hooks/useCollection'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Users, Newspaper, Clock, MessageSquare } from "lucide-react"

const ADMIN_EMAIL = 'isp1195@gmail.com'

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const { data: users, loading: usersLoading, error: dataError } = useCollection('users')
  const { data: boards, loading: boardsLoading } = useCollection('boards')
  const router = useRouter()

  const isAdmin = user?.email === ADMIN_EMAIL

  // 인증 상태 확인 및 권한 없는 사용자 리디렉션
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // 로딩 중인 경우
  if (authLoading || usersLoading || boardsLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // 관리자가 아닌 경우
  if (!isAdmin) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500">접근 제한됨</CardTitle>
          <CardDescription>
            이 페이지에 접근할 수 있는 권한이 없습니다.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => router.push('/')}>
            홈으로 돌아가기
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // 대시보드 카드 데이터
  const dashboardItems = [
    {
      title: '전체 사용자',
      value: users?.length || 0,
      icon: <Users className="h-8 w-8 text-blue-500" />,
      link: '/admin/users'
    },
    {
      title: '게시판',
      value: boards?.length || 0,
      icon: <Newspaper className="h-8 w-8 text-green-500" />,
      link: '/admin/boards'
    },
    {
      title: '오늘 활동',
      value: '확인 중...',
      icon: <Clock className="h-8 w-8 text-amber-500" />,
      link: '#'
    },
    {
      title: '미해결 신고',
      value: 0,
      icon: <MessageSquare className="h-8 w-8 text-red-500" />,
      link: '#'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          웹사이트 현황 및 통계 정보입니다.
        </p>
      </div>
      
      {dataError && (
        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-4 text-red-600">
            데이터를 불러오는 중 오류가 발생했습니다.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardItems.map((item, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.title}
              </CardTitle>
              {item.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
            <CardFooter className="p-2 border-t">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => router.push(item.link)}>
                자세히 보기
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>최근 가입한 사용자</CardTitle>
            <CardDescription>최근에 가입한 5명의 사용자</CardDescription>
          </CardHeader>
          <CardContent>
            {!users || users.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                사용자가 없습니다
              </p>
            ) : (
              <div className="space-y-4">
                {users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center space-x-4">
                    <div className="rounded-full bg-muted p-2">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name || '이름 없음'}</p>
                      <p className="text-sm text-muted-foreground">{user.email || '이메일 없음'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>활성 게시판</CardTitle>
            <CardDescription>현재 활성화된 게시판 목록</CardDescription>
          </CardHeader>
          <CardContent>
            {!boards || boards.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                게시판이 없습니다
              </p>
            ) : (
              <div className="space-y-4">
                {boards.slice(0, 5).map((board) => (
                  <div key={board.id} className="flex items-center space-x-4">
                    <div className="rounded-full bg-muted p-2">
                      <Newspaper className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{board.title || '제목 없음'}</p>
                      <p className="text-sm text-muted-foreground">
                        {board.description?.substring(0, 50) || '설명 없음'}
                        {board.description?.length > 50 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardFooter className="border-t px-6 py-3">
          <div className="text-xs text-muted-foreground">
            마지막 업데이트: {new Date().toLocaleString('ko-KR')}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}