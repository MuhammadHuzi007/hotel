import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computePricing, applyTaxesAndFees } from '@/lib/pricing'
import { createCheckoutSession } from '@/lib/stripe'
import { sendBookingConfirmation } from '@/lib/mailer'
import { logAudit } from '@/lib/audit'
import { Decimal } from '@prisma/client/runtime/library'
import { toNumber } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      hotelId,
      roomTypeId,
      checkIn,
      checkOut,
      guestName,
      guestEmail,
      guestPhone,
      ratePlanId,
    } = body

    if (!hotelId || !roomTypeId || !checkIn || !checkOut || !guestName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'checkIn must be before checkOut' },
        { status: 400 }
      )
    }

    // Find available room
    const roomType = await prisma.roomType.findUnique({
      where: { id: parseInt(roomTypeId) },
      include: {
        rooms: {
          where: {
            hotelId: parseInt(hotelId),
            status: 'vacant_clean',
          }
        }
      }
    })

    if (!roomType || roomType.rooms.length === 0) {
      return NextResponse.json(
        { error: 'No rooms available' },
        { status: 400 }
      )
    }

    // Check for overlapping bookings
    const overlapping = await prisma.booking.findFirst({
      where: {
        hotelId: parseInt(hotelId),
        status: { in: ['booked', 'checked_in'] },
        OR: [
          {
            AND: [
              { checkIn: { lte: checkOutDate } },
              { checkOut: { gte: checkInDate } },
            ],
          },
        ],
      },
    })

    if (overlapping) {
      return NextResponse.json(
        { error: 'Room is already booked for these dates' },
        { status: 400 }
      )
    }

    // Compute pricing
    const pricing = await computePricing({
      hotelId: parseInt(hotelId),
      roomTypeId: parseInt(roomTypeId),
      ratePlanId: ratePlanId ? parseInt(ratePlanId) : undefined,
      checkIn: checkInDate,
      checkOut: checkOutDate,
    })

    const room = roomType.rooms[0]

    // Create booking
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          hotelId: parseInt(hotelId),
          roomId: room.id,
          guestName,
          guestEmail,
          guestPhone,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          ratePlanId: ratePlanId ? parseInt(ratePlanId) : null,
          nightlyTotal: pricing.nightlyTotal,
          taxTotal: pricing.taxTotal,
          feeTotal: pricing.feeTotal,
          serviceTotal: new Decimal(0),
          grandTotal: pricing.grandTotal,
          totalAmount: pricing.grandTotal, // Legacy field
          status: 'booked',
        },
      })

      await tx.room.update({
        where: { id: room.id },
        data: { status: 'reserved' },
      })

      return newBooking
    })

    // Create Stripe checkout session
    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const session = await createCheckoutSession({
      bookingId: booking.id,
      amount: booking.grandTotal,
      customerEmail: guestEmail,
      successUrl: `${appUrl}/public/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/public/checkout?bookingId=${booking.id}`,
      lineItems: [
        {
          name: `Room ${room.roomNumber} - ${roomType.name}`,
          amount: pricing.nightlyTotal,
          quantity: 1,
        },
      ],
    })

    // Log audit
    await logAudit({
      hotelId: parseInt(hotelId),
      action: 'create',
      entity: 'Booking',
      entityId: booking.id,
      diff: { guestName, checkIn, checkOut, grandTotal: toNumber(booking.grandTotal) },
    })

    // Send confirmation email (async, don't wait)
    if (guestEmail) {
      const hotel = await prisma.hotel.findUnique({ where: { id: parseInt(hotelId) } })
      sendBookingConfirmation({
        to: guestEmail,
        guestName,
        bookingId: booking.id,
        hotelName: hotel?.name || 'Hotel',
        checkIn: checkInDate,
        checkOut: checkOutDate,
        roomNumber: room.roomNumber,
        total: toNumber(booking.grandTotal),
      }).catch(console.error)
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        guestName: booking.guestName,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        grandTotal: toNumber(booking.grandTotal),
      },
      checkoutUrl: session.url,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Public booking error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    )
  }
}

