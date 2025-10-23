import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  or,
  QueryConstraint,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  Event,
  ProjectionPhase2,
  UserProfile,
  StreakUserRow,
  UserDetailData,
  User
} from '@/types/firestore'

/**
 * Convert API response to ProjectionPhase2 with proper Firestore Timestamp objects
 */
function convertApiResponseToProjection(data: Record<string, unknown>): ProjectionPhase2 {
  const rawData = data as {
    status: { type: string; deadline?: { seconds: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number } }
    currentStreak: number
    originalStreak: number
    longestStreak: number
    lastContributionDate: string | null
    appliedSeq: number
    projectorVersion: string
    lastEvaluatedDayKey?: string
  }

  const projection: ProjectionPhase2 = {
    status: rawData.status as ProjectionPhase2['status'],
    currentStreak: rawData.currentStreak,
    originalStreak: rawData.originalStreak,
    longestStreak: rawData.longestStreak,
    lastContributionDate: rawData.lastContributionDate,
    appliedSeq: rawData.appliedSeq,
    projectorVersion: rawData.projectorVersion,
    lastEvaluatedDayKey: rawData.lastEvaluatedDayKey
  }

  // Convert deadline timestamp if present (for 'eligible' status)
  if (projection.status.type === 'eligible' && rawData.status.deadline) {
    const deadlineData = rawData.status.deadline
    // Convert from JSON timestamp format to Firestore Timestamp
    projection.status.deadline = new Timestamp(
      deadlineData.seconds || deadlineData._seconds || 0,
      deadlineData.nanoseconds || deadlineData._nanoseconds || 0
    )
  }

  return projection
}

/**
 * Call the Cloud Function compute endpoint to get fresh projection
 * This performs on-demand computation and write-behind caching
 */
export const computeProjection = async (uid: string): Promise<ProjectionPhase2> => {
  const baseUrl = process.env.NEXT_PUBLIC_CLOUD_FUNCTIONS_URL

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_CLOUD_FUNCTIONS_URL is not configured')
  }

  const url = `${baseUrl}/computeUserStreakProjectionHttp?uid=${uid}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Compute projection failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    return convertApiResponseToProjection(data)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to compute projection for ${uid}: ${error.message}`)
    }
    throw error
  }
}

/**
 * Fetch users with write permission to specific boards
 */
export const fetchUsersWithBoardPermission = async (boardIds: string[]): Promise<User[]> => {
  try {
    if (boardIds.length === 0) return []

    // Use OR query for multiple board permissions
    const conditions = boardIds.map(boardId =>
      where(`boardPermissions.${boardId}`, '==', 'write')
    )

    const q = query(
      collection(db, 'users'),
      or(...conditions)
    )

    const snapshot = await getDocs(q)
    const users: User[] = []

    snapshot.docs.forEach(docSnapshot => {
      const userData = docSnapshot.data() as User
      // Ensure document ID is included
      users.push({
        ...userData,
        uid: docSnapshot.id // Override with actual document ID
      })
    })

    return users
  } catch (error) {
    console.error('Error fetching users with board permission:', error)
    return []
  }
}

/**
 * Fetch all users with their streak projections (computed on-demand) and profiles
 * @param activeBoardId - Optional board ID to filter only active users
 */
export const fetchStreakUsers = async (activeBoardId?: string): Promise<StreakUserRow[]> => {
  // Get users with active board permission if specified
  let userIds: string[] | null = null

  if (activeBoardId) {
    const activeUsers = await fetchUsersWithBoardPermission([activeBoardId])
    userIds = activeUsers.map(u => u.uid)

    // If no active users found, return empty array
    if (userIds.length === 0) return []
  }

  // Get all users or filter by active user IDs
  const usersRef = collection(db, 'users')
  const usersSnapshot = await getDocs(usersRef)

  // Filter users if needed
  const targetUsers = usersSnapshot.docs.filter(docSnapshot => {
    if (!userIds) return true // Include all if no filter
    return userIds.includes(docSnapshot.id)
  })

  const userRows: StreakUserRow[] = []

  // Batch compute projections with concurrency control
  const BATCH_SIZE = 15
  for (let i = 0; i < targetUsers.length; i += BATCH_SIZE) {
    const batch = targetUsers.slice(i, i + BATCH_SIZE)

    const batchResults = await Promise.all(
      batch.map(async (userDocSnapshot) => {
        const uid = userDocSnapshot.id

        try {
          // Compute fresh projection via Cloud Function
          const projection = await computeProjection(uid)

          // Get user data for profile
          const userData = userDocSnapshot.data() as User
          const profileMap = userData.profile || {}
          const profile: UserProfile = {
            timezone: profileMap.timezone,
            displayName: userData.realName || userData.nickname || userData.email || null,
            email: userData.email
          }

          return {
            uid,
            displayName: profile.displayName || null,
            email: profile.email || null,
            timezone: profile.timezone || 'Asia/Seoul', // Default timezone
            status: projection.status,
            currentStreak: projection.currentStreak,
            longestStreak: projection.longestStreak,
            lastContributionDate: projection.lastContributionDate,
            appliedSeq: projection.appliedSeq
          } as StreakUserRow
        } catch (error) {
          console.error(`Failed to compute projection for user ${uid}:`, error)
          return null // Skip users with compute errors
        }
      })
    )

    // Add successful results to userRows
    batchResults.forEach(result => {
      if (result) userRows.push(result)
    })
  }

  return userRows
}

/**
 * Fetch a single user's projection
 */
export const fetchUserProjection = async (uid: string): Promise<ProjectionPhase2 | null> => {
  const projectionRef = doc(db, `users/${uid}/streak_es/currentPhase2`)
  const snapshot = await getDoc(projectionRef)

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as ProjectionPhase2
}

/**
 * Fetch a single user's profile
 * Note: Profile data is stored as a Map field in the main user document
 */
export const fetchUserProfile = async (uid: string): Promise<UserProfile> => {
  const userRef = doc(db, `users/${uid}`)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    return {}
  }

  const userData = snapshot.data() as User
  const profileMap = userData.profile || {}

  // Extract profile fields from the profile Map
  return {
    timezone: profileMap.timezone,
    displayName: userData.realName || userData.nickname || userData.email || null,
    email: userData.email
  }
}

/**
 * Fetch user detail data (computed projection + profile)
 */
export const fetchUserDetailData = async (uid: string): Promise<UserDetailData | null> => {
  try {
    const [projection, profile] = await Promise.all([
      computeProjection(uid), // Use compute endpoint instead of cached projection
      fetchUserProfile(uid)
    ])

    return {
      uid,
      profile,
      projection
    }
  } catch (error) {
    console.error(`Failed to fetch user detail for ${uid}:`, error)
    return null
  }
}

/**
 * Options for fetching user events
 */
export interface FetchEventsOptions {
  limitCount?: number
  startSeq?: number
  endSeq?: number
  eventTypes?: string[]
  orderDirection?: 'asc' | 'desc'
}

/**
 * Fetch user events with optional filters
 */
export const fetchUserEvents = async (
  uid: string,
  options: FetchEventsOptions = {}
): Promise<Event[]> => {
  const {
    limitCount = 100,
    startSeq,
    endSeq,
    eventTypes,
    orderDirection = 'desc'
  } = options

  const eventsRef = collection(db, `users/${uid}/events`)
  const constraints: QueryConstraint[] = []

  // Order by seq
  constraints.push(orderBy('seq', orderDirection))

  // Filter by seq range
  if (startSeq !== undefined) {
    constraints.push(where('seq', '>=', startSeq))
  }
  if (endSeq !== undefined) {
    constraints.push(where('seq', '<=', endSeq))
  }

  // Filter by event types (client-side for now, as Firestore doesn't support array contains for where)
  // We'll fetch all and filter client-side if needed

  // Limit
  constraints.push(limit(limitCount))

  const q = query(eventsRef, ...constraints)
  const snapshot = await getDocs(q)

  let events = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Event[]

  // Client-side filter by event types
  if (eventTypes && eventTypes.length > 0) {
    events = events.filter(event => eventTypes.includes(event.type))
  }

  return events
}

/**
 * Fetch events within a date range (last N days)
 */
export const fetchRecentEvents = async (
  uid: string,
  days: number = 14
): Promise<Event[]> => {
  // Calculate start date
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - days)

  const startDayKey = formatDateToDayKey(startDate)

  const eventsRef = collection(db, `users/${uid}/events`)
  const q = query(
    eventsRef,
    where('dayKey', '>=', startDayKey),
    orderBy('dayKey', 'asc'), // Must use 'asc' when using inequality filter
    orderBy('seq', 'asc'),
    limit(100)
  )

  const snapshot = await getDocs(q)
  // Reverse the results to get newest first (since we ordered asc for Firestore constraint)
  const events = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Event[]

  return events.reverse()
}

/**
 * Helper: format Date to YYYY-MM-DD
 */
function formatDateToDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
