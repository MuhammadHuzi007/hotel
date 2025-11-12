import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import { getSession } from './auth'
import { getActiveHotelId } from './context'

export type HotelRole = 'admin' | 'manager' | 'employee' | 'viewer'

export async function requireHotelRole(
  request: NextRequest,
  allowedRoles: HotelRole[]
): Promise<{ userId: number; hotelId: number; role: HotelRole }> {
  const session = await getSession(request)
  if (!session) {
    throw new Error('Unauthorized')
  }

  const hotelId = await getActiveHotelId(request)
  if (!hotelId) {
    throw new Error('No active hotel selected')
  }

  const membership = await prisma.hotelMember.findUnique({
    where: {
      userId_hotelId: {
        userId: session.userId,
        hotelId
      }
    }
  })

  if (!membership) {
    throw new Error('Not a member of this hotel')
  }

  if (!allowedRoles.includes(membership.role)) {
    throw new Error('Insufficient permissions')
  }

  return {
    userId: session.userId,
    hotelId,
    role: membership.role
  }
}

export async function requireHotelAccess(request: NextRequest): Promise<{ userId: number; hotelId: number }> {
  const session = await getSession(request)
  if (!session) {
    throw new Error('Unauthorized')
  }

  const hotelId = await getActiveHotelId(request)
  if (!hotelId) {
    throw new Error('No active hotel selected')
  }

  const membership = await prisma.hotelMember.findUnique({
    where: {
      userId_hotelId: {
        userId: session.userId,
        hotelId
      }
    }
  })

  if (!membership) {
    throw new Error('Not a member of this hotel')
  }

  return {
    userId: session.userId,
    hotelId
  }
}

