'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PostsPage() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>게시물 관리</CardTitle>
          <CardDescription>
            모든 게시물을 조회, 편집하고 필요한 경우 삭제합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>게시물 관리 기능이 여기에 구현될 예정입니다.</p>
        </CardContent>
      </Card>
    </div>
  )
} 