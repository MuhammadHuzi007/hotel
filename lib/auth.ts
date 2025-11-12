import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export interface Session {
  userId: number
  username: string
  role: 'admin' | 'employee' | 'customer'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function getSession(request: NextRequest): Promise<Session | null> {
  const sessionCookie = request.cookies.get('session')
  if (!sessionCookie) return null

  try {
    const session = JSON.parse(sessionCookie.value) as Session
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, username: true, role: true }
    })
    if (!user) return null
    return session
  } catch {
    return null
  }
}

export function requireAuth(request: NextRequest, allowedRoles?: ('admin' | 'employee' | 'customer')[]): Session {
  const session = request.cookies.get('session')
  if (!session) {
    throw new Error('Unauthorized')
  }

  try {
    const sessionData = JSON.parse(session.value) as Session
    if (allowedRoles && !allowedRoles.includes(sessionData.role)) {
      throw new Error('Forbidden')
    }
    return sessionData
  } catch {
    throw new Error('Unauthorized')
  }
}

