import Stripe from 'stripe'
import { Decimal } from '@prisma/client/runtime/library'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

export function toCents(amount: Decimal | number): number {
  const num = typeof amount === 'number' ? amount : amount.toNumber()
  return Math.round(num * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

export async function createCheckoutSession(params: {
  bookingId: number
  amount: Decimal
  currency?: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  lineItems?: Array<{ name: string; amount: Decimal; quantity?: number }>
}) {
  const { bookingId, amount, currency = 'usd', successUrl, cancelUrl, customerEmail, lineItems } = params

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: `booking_${bookingId}`,
    line_items: lineItems
      ? lineItems.map(item => ({
          price_data: {
            currency,
            product_data: {
              name: item.name,
            },
            unit_amount: toCents(item.amount),
          },
          quantity: item.quantity || 1,
        }))
      : [
          {
            price_data: {
              currency,
              product_data: {
                name: `Booking #${bookingId}`,
              },
              unit_amount: toCents(amount),
            },
            quantity: 1,
          },
        ],
  }

  if (customerEmail) {
    sessionParams.customer_email = customerEmail
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return session
}

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

