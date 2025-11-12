import { prisma } from './prisma'
import { hashPassword, verifyPassword } from './auth'
import { v4 as uuidv4 } from 'uuid'
import { logAudit } from './audit'

// Generate a new API key (returns plaintext once, then only hash stored)
export async function createApiKey(
  hotelId: number,
  name: string,
  userId?: number
): Promise<{ id: number; key: string }> {
  // Generate a secure API key
  const plaintextKey = `hk_${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '').substring(0, 16)}`
  const keyHash = await hashPassword(plaintextKey)

  const apiKey = await prisma.apiKey.create({
    data: {
      hotelId,
      name,
      keyHash,
    },
  })

  await logAudit({
    hotelId,
    userId,
    action: 'create',
    entity: 'ApiKey',
    entityId: apiKey.id,
    diff: { name },
  })

  return {
    id: apiKey.id,
    key: plaintextKey, // Return once, never stored
  }
}

// Verify API key and return hotel ID
export async function verifyApiKey(apiKey: string): Promise<{ hotelId: number; apiKeyId: number } | null> {
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      hotel: {
        // Only active hotels
      },
    },
    include: {
      hotel: true,
    },
  })

  for (const key of apiKeys) {
    try {
      const isValid = await verifyPassword(apiKey, key.keyHash)
      if (isValid) {
        // Update last used
        await prisma.apiKey.update({
          where: { id: key.id },
          data: { lastUsedAt: new Date() },
        })

        return {
          hotelId: key.hotelId,
          apiKeyId: key.id,
        }
      }
    } catch {
      // Continue checking other keys
    }
  }

  return null
}

// Mask API key for display (show only last 8 chars)
export function maskApiKey(key: string): string {
  if (key.length <= 8) return '****'
  return `****${key.slice(-8)}`
}

// Delete/rotate API key
export async function deleteApiKey(
  hotelId: number,
  apiKeyId: number,
  userId?: number
): Promise<void> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
  })

  if (!apiKey || apiKey.hotelId !== hotelId) {
    throw new Error('API key not found')
  }

  await prisma.apiKey.delete({
    where: { id: apiKeyId },
  })

  await logAudit({
    hotelId,
    userId,
    action: 'delete',
    entity: 'ApiKey',
    entityId: apiKeyId,
  })
}

// List API keys for hotel (masked)
export async function listApiKeys(hotelId: number) {
  return prisma.apiKey.findMany({
    where: { hotelId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      lastUsedAt: true,
      // Don't return keyHash
    },
    orderBy: { createdAt: 'desc' },
  })
}

