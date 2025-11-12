import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { redis as ioredis } from './redis'

// Use Upstash if available, otherwise fallback to local Redis
let ratelimitClient: any

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimitClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
} else {
  // Fallback to local Redis using a simple implementation
  ratelimitClient = {
    async pipeline(commands: any[]) {
      const results = []
      for (const [cmd, ...args] of commands) {
        if (cmd === 'incr') {
          const key = args[0]
          const count = await ioredis.incr(key)
          const ttl = await ioredis.ttl(key)
          if (ttl === -1) {
            const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
            await ioredis.expire(key, Math.ceil(windowMs / 1000))
          }
          results.push([null, count])
        } else if (cmd === 'expire') {
          await ioredis.expire(args[0], args[1])
          results.push([null, 'OK'])
        }
      }
      return results
    },
  }
}

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '100')

// Per-IP rate limiter
export const ipRateLimit = new Ratelimit({
  redis: ratelimitClient,
  limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
  analytics: true,
  prefix: 'ratelimit:ip',
})

// Per-API-key rate limiter (more generous)
export const apiKeyRateLimit = new Ratelimit({
  redis: ratelimitClient,
  limiter: Ratelimit.slidingWindow(maxRequests * 10, `${windowMs} ms`),
  analytics: true,
  prefix: 'ratelimit:apikey',
})

// Helper to get IP from request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIP || 'unknown'
  return ip
}

// Middleware helper
export async function checkRateLimit(
  identifier: string,
  type: 'ip' | 'apikey' = 'ip'
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const limiter = type === 'ip' ? ipRateLimit : apiKeyRateLimit
  const result = await limiter.limit(identifier)
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}

