import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export function ExplainPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Explain Panel</CardTitle>
        <CardDescription>
          일별 연속 기록 추론 과정
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-2">
            이 기능은 향후 구현될 예정입니다
          </p>
          <p className="text-sm text-muted-foreground">
            Explain reducer를 사용하여 각 날짜별 상태 변화와 추론 과정을 표시할 예정입니다.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
