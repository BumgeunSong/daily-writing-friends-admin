'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function BoardsPage() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>게시판 관리</CardTitle>
          <CardDescription>
            게시판을 생성, 수정, 삭제하고 권한을 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>게시판 관리 기능이 여기에 구현될 예정입니다.</p>
        </CardContent>
      </Card>
    </div>
  )
} 