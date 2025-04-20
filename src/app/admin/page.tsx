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
import { LogOut, User, Mail } from "lucide-react"

const ADMIN_EMAIL = 'isp1195@gmail.com'

export default function AdminPage() {
  const { user, logout, loading: authLoading } = useAuth()
  const { data: users, loading: usersLoading, error: dataError } = useCollection('users')
  const router = useRouter()

  const isAdmin = user?.email === ADMIN_EMAIL

  // 인증 상태 확인 및 권한 없는 사용자 리디렉션
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // 로딩 중인 경우
  if (authLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>관리자 대시보드</CardTitle>
            <CardDescription>데이터 로딩 중...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // 관리자가 아닌 경우
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
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
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">관리자 대시보드</CardTitle>
            <CardDescription>사용자 관리 및 시스템 설정</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {dataError && (
            <Card className="bg-red-50 border-red-100">
              <CardContent className="p-4 text-red-600">
                데이터를 불러오는 중 오류가 발생했습니다.
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {!users || users.length === 0 ? (
              <Card className="p-4 text-center">
                <CardContent className="pt-4">
                  <p className="text-gray-500">등록된 사용자가 없습니다</p>
                </CardContent>
              </Card>
            ) : (
              users.map((user) => (
                <Card key={user.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">이름:</span>
                        <span className="ml-2">{user.name}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">이메일:</span>
                        <span className="ml-2">{user.email}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
        
        <CardFooter className="border-t pt-4 flex justify-between text-xs text-muted-foreground">
          <div>총 사용자: {users ? users.length : 0}명</div>
          <div>마지막 업데이트: {new Date().toLocaleString('ko-KR')}</div>
        </CardFooter>
      </Card>
    </div>
  )
}