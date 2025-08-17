import { useState } from 'react'
import { collection, addDoc, getDocs, Timestamp, query, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Board } from '@/types/firestore'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface CreateBoardData {
  cohort: number
  title: string
  description: string
  firstDay: Date
  lastDay: Date
}

/**
 * 다음 월요일(KST)을 반환하는 함수
 */
function getNextMonday(fromDate: Date): Date {
  const date = new Date(fromDate)
  const day = date.getDay()
  const daysUntilMonday = day === 0 ? 1 : (8 - day) % 7 || 7
  date.setDate(date.getDate() + daysUntilMonday)
  date.setHours(0, 0, 0, 0)
  return date
}

/**
 * 주어진 날짜로부터 4주 후 금요일을 반환하는 함수
 */
function getFridayOf4thWeek(fromDate: Date): Date {
  const date = new Date(fromDate)
  // 4주 = 28일에서 3일 뺀 25일 더하기 (월요일에서 금요일까지)
  date.setDate(date.getDate() + 25)
  date.setHours(23, 59, 59, 999)
  return date
}

/**
 * 날짜를 YYYY.MM.DD 형식으로 포맷하는 함수
 */
function formatDateForDescription(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

/**
 * 새로운 upcoming board를 생성하는 커스텀 훅
 */
export function useCreateUpcomingBoard() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)

  const createBoardMutation = useMutation({
    mutationFn: async (data: CreateBoardData) => {
      const boardData = {
        cohort: data.cohort,
        title: data.title,
        description: data.description,
        firstDay: Timestamp.fromDate(data.firstDay),
        lastDay: Timestamp.fromDate(data.lastDay),
        createdAt: Timestamp.now(),
        waitingUsersIds: []
      }

      const docRef = await addDoc(collection(db, 'boards'), boardData)
      return { id: docRef.id, ...boardData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    }
  })

  /**
   * 마지막 코호트 정보를 가져와서 다음 코호트 데이터를 자동 생성
   */
  const generateNextCohort = async (): Promise<CreateBoardData | null> => {
    try {
      setIsCreating(true)
      
      // 마지막 코호트 찾기
      const boardsRef = collection(db, 'boards')
      const q = query(boardsRef, orderBy('cohort', 'desc'), limit(1))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        // 첫 번째 코호트 생성
        const firstDay = getNextMonday(new Date())
        const lastDay = getFridayOf4thWeek(firstDay)
        
        return {
          cohort: 1,
          title: '매일 글쓰기 프렌즈 1기',
          description: `${formatDateForDescription(firstDay)} - ${formatDateForDescription(lastDay)}`,
          firstDay,
          lastDay
        }
      }

      const lastBoard = snapshot.docs[0].data() as Board
      const lastCohort = lastBoard.cohort || 0
      const nextCohort = lastCohort + 1

      // 마지막 코호트의 lastDay를 기준으로 다음 월요일 계산
      let baseDate = new Date()
      if (lastBoard.lastDay) {
        const lastDayDate = lastBoard.lastDay instanceof Timestamp 
          ? lastBoard.lastDay.toDate() 
          : new Date(lastBoard.lastDay)
        baseDate = lastDayDate
      }

      const firstDay = getNextMonday(baseDate)
      const lastDay = getFridayOf4thWeek(firstDay)

      return {
        cohort: nextCohort,
        title: `매일 글쓰기 프렌즈 ${nextCohort}기`,
        description: `${formatDateForDescription(firstDay)} - ${formatDateForDescription(lastDay)}`,
        firstDay,
        lastDay
      }
    } catch (error) {
      console.error('Error generating next cohort:', error)
      return null
    } finally {
      setIsCreating(false)
    }
  }

  /**
   * 다음 코호트를 자동으로 생성하고 Firestore에 저장
   */
  const createNextCohort = async () => {
    const nextCohortData = await generateNextCohort()
    if (nextCohortData) {
      return createBoardMutation.mutateAsync(nextCohortData)
    }
    throw new Error('Failed to generate next cohort data')
  }

  return {
    createNextCohort,
    generateNextCohort,
    createBoard: createBoardMutation.mutate,
    isCreating: isCreating || createBoardMutation.isPending,
    error: createBoardMutation.error
  }
}