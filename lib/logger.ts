import pino from 'pino'
import { v4 as uuidv4 } from 'uuid'

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  base: {
    env: process.env.NODE_ENV,
  },
})

// Request logger middleware helper
export function createRequestLogger(requestId?: string) {
  const id = requestId || uuidv4()
  return logger.child({ requestId: id })
}

// Enrich logger with context
export function enrichLogger(context: Record<string, any>) {
  return logger.child(context)
}

// Log levels
export const log = {
  debug: (msg: string, ...args: any[]) => logger.debug({}, msg, ...args),
  info: (msg: string, ...args: any[]) => logger.info({}, msg, ...args),
  warn: (msg: string, ...args: any[]) => logger.warn({}, msg, ...args),
  error: (msg: string, error?: Error | any, ...args: any[]) => {
    if (error instanceof Error) {
      logger.error({ err: error, stack: error.stack }, msg, ...args)
    } else {
      logger.error({ err: error }, msg, ...args)
    }
  },
}

export default logger

