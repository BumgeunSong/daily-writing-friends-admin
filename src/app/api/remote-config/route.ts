import { NextRequest, NextResponse } from 'next/server'
import { initAdmin } from '../firebaseAdmin'

/**
 * GET: Fetch current Remote Config values
 */
export async function GET() {
  try {
    const app = await initAdmin()
    const remoteConfig = app.remoteConfig()
    
    // Get the current template
    const template = await remoteConfig.getTemplate()
    
    // Extract the values we need
    const activeBoard = template.parameters?.active_board_id?.defaultValue?.value || ''
    const upcomingBoard = template.parameters?.upcoming_board_id?.defaultValue?.value || ''
    
    return NextResponse.json({
      active_board_id: activeBoard,
      upcoming_board_id: upcomingBoard
    })
  } catch (error) {
    console.error('Error fetching remote config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch remote config' },
      { status: 500 }
    )
  }
}

/**
 * PUT: Update Remote Config values with validation
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { active_board_id, upcoming_board_id } = body
    
    // Validation: boards must be different if both are set
    if (active_board_id && upcoming_board_id && active_board_id === upcoming_board_id) {
      return NextResponse.json(
        { error: '현재 진행 중인 게시판과 다음 예정 게시판은 달라야 합니다.' },
        { status: 400 }
      )
    }
    
    const app = await initAdmin()
    const remoteConfig = app.remoteConfig()
    
    // Get the current template
    const template = await remoteConfig.getTemplate()
    
    // Update the parameters
    template.parameters = {
      ...template.parameters,
      active_board_id: {
        defaultValue: { value: active_board_id || '' }
      },
      upcoming_board_id: {
        defaultValue: { value: upcoming_board_id || '' }
      }
    }
    
    // Publish the updated template
    await remoteConfig.publishTemplate(template)
    
    return NextResponse.json({
      success: true,
      active_board_id,
      upcoming_board_id
    })
  } catch (error) {
    console.error('Error updating remote config:', error)
    return NextResponse.json(
      { error: 'Failed to update remote config' },
      { status: 500 }
    )
  }
}