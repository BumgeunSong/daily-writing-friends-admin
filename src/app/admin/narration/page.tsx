'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Mic, Calendar, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNarrations } from '@/hooks/useNarrations'
import { formatDate } from '@/lib/utils'

export default function NarrationListPage() {
  const { user } = useAuth()
  const { narrations, isLoading, createNarration, isCreating } = useNarrations()
  const [newNarrationTitle, setNewNarrationTitle] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleCreateNarration = async () => {
    if (!newNarrationTitle.trim() || !user) return
    
    try {
      await createNarration(newNarrationTitle.trim(), user.uid)
      setNewNarrationTitle('')
      setDialogOpen(false)
    } catch (error) {
      console.error('Failed to create narration:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">내레이션 가이드</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">내레이션 가이드</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              새 내레이션
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 내레이션 만들기</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={newNarrationTitle}
                  onChange={(e) => setNewNarrationTitle(e.target.value)}
                  placeholder="내레이션 제목을 입력하세요"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNarration()
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isCreating}
                >
                  취소
                </Button>
                <Button
                  onClick={handleCreateNarration}
                  disabled={!newNarrationTitle.trim() || isCreating}
                >
                  {isCreating ? '생성 중...' : '생성'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {narrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mic className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">내레이션이 없습니다</h3>
            <p className="text-muted-foreground text-center mb-4">
              첫 번째 내레이션 가이드를 만들어보세요
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  새 내레이션
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {narrations.map((narration) => (
            <Card key={narration.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  {narration.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(narration.createdAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    생성자: {narration.createdBy}
                  </div>
                </div>
                <div className="mt-4">
                  <Link href={`/admin/narration/${narration.id}`}>
                    <Button variant="outline" className="w-full">
                      편집하기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}