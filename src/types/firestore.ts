/**
 * Firestore 데이터베이스의 타입 정의
 * @firestore_schema.md 기반으로 생성됨
 */

import { Timestamp } from 'firebase/firestore'

/**
 * User 컬렉션의 문서 타입
 */
export interface User {
  id: string
  uid: string
  realName: string | null
  nickname: string | null
  email: string | null
  profilePhotoURL: string | null
  bio: string | null
  phoneNumber: string | null
  referrer: string | null
  boardPermissions: {
    [boardId: string]: 'read' | 'write' | 'admin'
  }
}

/**
 * Board 컬렉션의 문서 타입
 */
export interface Board {
  id: string
  title: string
  description: string
  createdAt: Date | Timestamp
  firstDay?: Timestamp
  lastDay?: Timestamp
  cohort?: number
  waitingUsersIds: string[]
}

/**
 * Notification 서브컬렉션의 문서 타입
 */
export interface Notification {
  id: string
  type: 'COMMENT_ON_POST' | 'REPLY_ON_COMMENT' | 'REPLY_ON_POST'
  boardId: string
  postId: string
  commentId?: string
  replyId?: string
  fromUserId: string
  fromUserProfileImage?: string
  message: string
  timestamp: Timestamp
  read: boolean
}

/**
 * WritingHistory 서브컬렉션의 문서 타입
 */
export interface WritingHistory {
  day: string
  createdAt: Timestamp
  board: {
    id: string
  }
  post: {
    id: string
    contentLength: number
  }
}

/**
 * Posting 서브컬렉션의 문서 타입
 */
export interface Posting {
  board: {
    id: string
  }
  post: {
    id: string
    title: string
    contentLength: number
  }
  createdAt: Timestamp
}

/**
 * Commenting 서브컬렉션의 문서 타입
 */
export interface Commenting {
  board: {
    id: string
  }
  post: {
    id: string
    authorId: string
  }
  comment: {
    id: string
  }
  createdAt: Timestamp
}

/**
 * Replying 서브컬렉션의 문서 타입
 */
export interface Replying {
  board: {
    id: string
  }
  post: {
    id: string
    authorId: string
  }
  comment: {
    id: string
    authorId: string
  }
  reply: {
    id: string
  }
  createdAt: Timestamp
}

/**
 * Post 서브컬렉션의 문서 타입
 */
export interface Post {
  id: string
  boardId: string
  title: string
  content: string
  thumbnailImageURL?: string
  authorId: string
  authorName: string
  createdAt?: Date | Timestamp
  updatedAt?: Date | Timestamp
  countOfComments: number
  countOfReplies: number
  weekDaysFromFirstDay?: number
}

/**
 * Comment 서브컬렉션의 문서 타입
 */
export interface Comment {
  id: string
  content: string
  userId: string
  userName: string
  userProfileImage: string
  createdAt: Timestamp
}

/**
 * Reply 서브컬렉션의 문서 타입
 */
export interface Reply {
  id: string
  content: string
  userId: string
  userName: string
  userProfileImage: string
  createdAt: Timestamp
}

/**
 * Review 서브컬렉션의 문서 타입
 */
export interface Review {
  createdAt: Timestamp
  keep: string
  nps: number
  problem: string
  reviewer: {
    nickname: string
    uid: string
  }
  try: string
  willContinue: string
}

/**
 * UserApprovalPage에서 사용하는 WaitingUser 타입
 */
export interface WaitingUser extends User {
  previousPostsCount?: number | null
}

/**
 * firebaseMessagingTokens 서브컬렉션의 문서 타입
 */
export interface FirebaseMessagingToken {
  id: string // 문서 ID
  token: string
  timestamp: string | Timestamp
  userAgent?: string | null
}

/**
 * 유저 정보가 포함된 FCM 토큰 타입 (관리자 패널용)
 */
export interface FirebaseMessagingTokenWithUser extends FirebaseMessagingToken {
  user: User
}

/**
 * Narration 컬렉션의 문서 타입
 */
export interface Narration {
  id: string
  title: string
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * NarrationSection 서브컬렉션의 문서 타입
 */
export interface NarrationSection {
  id: string
  title: string
  script: string
  pauseMinutes: number
  storagePath: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * Holiday 타입 (공휴일 항목)
 */
export interface Holiday {
  date: string // YYYY-MM-DD format
  name: string
}

/**
 * HolidayYear 컬렉션의 문서 타입
 */
export interface HolidayYear {
  year: string // Document ID (e.g., "2025")
  items: Holiday[]
} 