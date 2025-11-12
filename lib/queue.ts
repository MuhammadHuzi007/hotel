import { Queue, Worker, QueueEvents } from 'bullmq'
import { redis } from './redis'

// Queue names
export const QUEUE_NAMES = {
  PRICING: 'pricing',
  OTA_SYNC: 'ota-sync',
  EMAIL: 'email',
  WEBHOOK: 'webhook',
  REPORT: 'report',
} as const

// Create queues
export const pricingQueue = new Queue(QUEUE_NAMES.PRICING, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

export const otaSyncQueue = new Queue(QUEUE_NAMES.OTA_SYNC, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
})

export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
})

export const webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK, {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

export const reportQueue = new Queue(QUEUE_NAMES.REPORT, {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  },
})

// Queue events for monitoring
export const pricingQueueEvents = new QueueEvents(QUEUE_NAMES.PRICING, {
  connection: redis,
})

export const otaSyncQueueEvents = new QueueEvents(QUEUE_NAMES.OTA_SYNC, {
  connection: redis,
})

// Helper to get queue stats
export async function getQueueStats() {
  const queues = [
    { name: QUEUE_NAMES.PRICING, queue: pricingQueue },
    { name: QUEUE_NAMES.OTA_SYNC, queue: otaSyncQueue },
    { name: QUEUE_NAMES.EMAIL, queue: emailQueue },
    { name: QUEUE_NAMES.WEBHOOK, queue: webhookQueue },
    { name: QUEUE_NAMES.REPORT, queue: reportQueue },
  ]

  const stats = await Promise.all(
    queues.map(async ({ name, queue }) => {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ])

      return {
        name,
        waiting,
        active,
        completed,
        failed,
      }
    })
  )

  return stats
}

