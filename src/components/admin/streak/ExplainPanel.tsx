import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">Phase 2.1: On-Demand Projection</h3>
            <p className="text-muted-foreground">
              프로젝션은 이제 요청 시마다 Cloud Function 엔드포인트를 통해 계산됩니다.
              백엔드에서 write-behind 방식으로 캐시를 업데이트하므로, 항상 최신 상태를 확인할 수 있습니다.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Virtual DayClosed Events</h3>
            <p className="text-muted-foreground">
              DayClosed 이벤트는 더 이상 Firestore에 저장되지 않습니다.
              대신 프로젝션 계산 시 가상으로 생성되어 처리됩니다.
              이를 통해 타임존별 자정 마감을 정확하게 처리할 수 있습니다.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Future: Explain Reducer</h3>
            <p className="text-muted-foreground">
              향후 Explain reducer가 구현되면, 각 날짜별 상태 변화와 추론 과정을
              상세하게 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
