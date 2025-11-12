import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { getSession } from './auth'

export async function getActiveHotelId(request?: NextRequest): Promise<number | null> {
  let cookieStore
  
  if (request) {
    cookieStore = request.cookies
  } else {
    cookieStore = await cookies()
  }

  const activeHotelId = cookieStore.get('activeHotelId')
  if (activeHotelId) {
    return parseInt(activeHotelId.value)
  }

  // Fallback: get first hotel user belongs to
  if (request) {
    try {
      const session = await getSession(request)
      if (session) {
        const membership = await prisma.hotelMember.findFirst({
          where: { userId: session.userId },
          orderBy: { id: 'asc' }
        })
        if (membership) {
          return membership.hotelId
        }
      }
    } catch {
      // Not authenticated
    }
  }

  return null
}

export async function requireActiveHotel(request: NextRequest): Promise<number> {
  const hotelId = await getActiveHotelId(request)
  if (!hotelId) {
    throw new Error('No active hotel selected')
  }
  return hotelId
}

export async function getUserHotels(userId: number) {
  return prisma.hotelMember.findMany({
    where: { userId },
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
          city: true
        }
      }
    },
    orderBy: {
      hotel: {
        name: 'asc'
      }
    }
  })
}

