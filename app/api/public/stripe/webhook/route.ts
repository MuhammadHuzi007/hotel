import { NextRequest, NextResponse } from 'next/server'
import { stripe, verifyWebhookSignature } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendReceipt } from '@/lib/mailer'
import { logAudit } from '@/lib/audit'
import { toNumber } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event
  try {
    event = verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${error.message}` },
      { status: 400 }
    )
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const bookingId = parseInt(session.client_reference_id?.replace('booking_', '') || '0')

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      )
    }

    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          hotel: true,
          room: true,
        }
      })

      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          amount: booking.grandTotal,
          method: 'online',
        },
      })

      // Log audit
      await logAudit({
        hotelId: booking.hotelId,
        action: 'payment_received',
        entity: 'Payment',
        entityId: payment.id,
        diff: {
          bookingId,
          amount: toNumber(payment.amount),
          method: 'online',
        },
      })

      // Send receipt email
      if (booking.guestEmail) {
        sendReceipt({
          to: booking.guestEmail,
          guestName: booking.guestName,
          bookingId: booking.id,
          paymentAmount: toNumber(payment.amount),
          paymentMethod: 'Credit Card',
        }).catch(console.error)
      }

      return NextResponse.json({ received: true })
    } catch (error: any) {
      console.error('Webhook processing error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}

