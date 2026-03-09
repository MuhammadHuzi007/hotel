import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// In a real app, you'd store preferences in the database
// For now, we'll use a simple in-memory store or localStorage on client side
// This is a placeholder that accepts and validates preferences

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { emailNotifications, smsNotifications, language, timezone, dateFormat } =
      await request.json()

    // Validate preferences
    const validLanguages = ['en', 'es', 'fr', 'de']
    const validDateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD MMM YYYY']

    if (language && !validLanguages.includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
    }

    if (dateFormat && !validDateFormats.includes(dateFormat)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    // In a production app, you would:
    // 1. Create a UserPreference model in Prisma
    // 2. Store these preferences in the database
    // 3. Load them when the user logs in
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      preferences: {
        emailNotifications: emailNotifications ?? true,
        smsNotifications: smsNotifications ?? false,
        language: language ?? 'en',
        timezone: timezone ?? 'UTC',
        dateFormat: dateFormat ?? 'MM/DD/YYYY',
      },
    })
  } catch (error) {
    console.error('Preferences save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

