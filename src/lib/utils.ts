import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore"
import { ProjectionPhase2Status } from "@/types/firestore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(timestamp: Timestamp | Date): string {
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Format a Date to YYYY-MM-DD string
 */
export function formatDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format a Timestamp in a specific timezone
 */
export function formatTsInTz(timestamp: Timestamp, timezone: string): string {
  const date = timestamp.toDate()
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: timezone,
    timeZoneName: 'short'
  }).format(date)
}

/**
 * Format a Timestamp in the browser's local timezone
 */
export function formatTsLocal(timestamp: Timestamp): string {
  const date = timestamp.toDate()
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  }).format(date)
}

/**
 * Get badge variant based on streak status
 */
export function getStatusBadgeVariant(status: ProjectionPhase2Status): 'default' | 'secondary' | 'destructive' {
  switch (status.type) {
    case 'onStreak':
      return 'default' // Green
    case 'eligible':
      return 'secondary' // Amber
    case 'missed':
      return 'destructive' // Red
    default:
      return 'outline'
  }
}

/**
 * Calculate projection lag display string
 */
export function calculateProjectionLag(appliedSeq: number, latestSeq: number | null): string {
  if (latestSeq === null) return `${appliedSeq} / -`
  const lag = latestSeq - appliedSeq
  return `${appliedSeq} / ${latestSeq}${lag > 0 ? ` (-${lag})` : ''}`
}
