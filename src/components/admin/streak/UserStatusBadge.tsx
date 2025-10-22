import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ProjectionPhase2Status } from '@/types/firestore'
import { getStatusBadgeVariant, formatTsInTz } from '@/lib/utils'

interface UserStatusBadgeProps {
  status: ProjectionPhase2Status
  timezone?: string
}

export function UserStatusBadge({ status, timezone = 'Asia/Seoul' }: UserStatusBadgeProps) {
  const variant = getStatusBadgeVariant(status)

  const getStatusLabel = () => {
    switch (status.type) {
      case 'onStreak':
        return '연속 중'
      case 'eligible':
        return '작성 가능'
      case 'missed':
        return '놓침'
      default:
        return status.type
    }
  }

  const getTooltipContent = () => {
    switch (status.type) {
      case 'onStreak':
        return '현재 연속 기록을 유지하고 있습니다'
      case 'eligible':
        return `${status.currentPosts}/${status.postsRequired} 작성 완료 · 마감: ${formatTsInTz(status.deadline, timezone)}`
      case 'missed':
        return `${status.missedDate}에 연속 기록이 끊겼습니다`
      default:
        return ''
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant}>{getStatusLabel()}</Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
