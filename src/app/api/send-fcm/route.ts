import { NextRequest, NextResponse } from 'next/server'
import * as admin from 'firebase-admin'

// Firebase Admin SDK 초기화 (이미 초기화된 경우 중복 방지)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  })
}

export async function POST(req: NextRequest) {
  try {
    const { tokens, notification, data } = await req.json()
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json({ success: false, message: '토큰이 필요합니다.' }, { status: 400 })
    }
    if (!notification || !notification.title || !notification.body) {
      return NextResponse.json({ success: false, message: '알림 제목/내용이 필요합니다.' }, { status: 400 })
    }

    // sendMulticast 타입 에러 우회: 개별 send() 호출
    const results = await Promise.all(
      tokens.map(token =>
        admin.messaging().send({
          token,
          notification,
          data,
        }).then(
          () => ({ success: true, token }),
          (error) => ({ success: false, token, error: error.message })
        )
      )
    )
    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    return NextResponse.json({
      success: true,
      message: `${successCount}개 메시지 전송 성공, ${failureCount}개 실패`,
      results,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'FCM 전송 오류', error: error.message }, { status: 500 })
  }
} 