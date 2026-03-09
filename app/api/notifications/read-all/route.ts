import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In a real app, you'd update all notifications as read in the database
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark all read error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

