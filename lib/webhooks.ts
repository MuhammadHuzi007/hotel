import crypto from 'crypto'
import { prisma } from './prisma'
import { webhookQueue } from './queue'
import { logAudit } from './audit'
import { logger } from './logger'

const WEBHOOK_SECRET = process.env.WEBHOOK_SIGNING_SECRET || 'whsec_local_example'

// Generate HMAC signature for webhook payload
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Send webhook event to all active endpoints for a hotel
export async function sendWebhookEvent(
  hotelId: number,
  eventType: string,
  payload: any
): Promise<void> {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      hotelId,
      isActive: true,
    },
  })

  if (endpoints.length === 0) {
    logger.debug({ hotelId, eventType }, 'No webhook endpoints configured')
    return
  }

  // Enqueue webhook delivery jobs
  for (const endpoint of endpoints) {
    await webhookQueue.add(
      `webhook-${endpoint.id}-${Date.now()}`,
      {
        endpointId: endpoint.id,
        hotelId,
        eventType,
        payload,
        secret: endpoint.secret,
        url: endpoint.url,
      },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    )
  }

  // Log event
  await prisma.publicWebhookEvent.create({
    data: {
      hotelId,
      type: eventType,
      payload,
    },
  })
}

// Process webhook delivery (called by worker)
export async function deliverWebhook(params: {
  endpointId: number
  hotelId: number
  eventType: string
  payload: any
  secret: string
  url: string
}): Promise<void> {
  const { endpointId, hotelId, eventType, payload, secret, url } = params

  const payloadString = JSON.stringify(payload)
  const signature = generateWebhookSignature(payloadString, secret)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotel-Id': hotelId.toString(),
        'X-Signature': signature,
        'X-Event-Type': eventType,
        'X-Timestamp': new Date().toISOString(),
      },
      body: payloadString,
    })

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`)
    }

    logger.info({ endpointId, hotelId, eventType }, 'Webhook delivered successfully')

    await logAudit({
      hotelId,
      action: 'webhook_delivered',
      entity: 'WebhookEndpoint',
      entityId: endpointId,
      diff: { eventType, url },
    })
  } catch (error: any) {
    logger.error({ endpointId, hotelId, eventType, error }, 'Webhook delivery failed')
    throw error // Will trigger retry
  }
}

