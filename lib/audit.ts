import { prisma } from './prisma'

export interface AuditLogData {
  hotelId: number
  userId?: number
  action: string
  entity: string
  entityId?: number
  diff?: Record<string, any>
}

export async function logAudit(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        hotelId: data.hotelId,
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        diff: data.diff || null,
      },
    })
  } catch (error) {
    // Don't fail the operation if audit logging fails
    console.error('Failed to log audit:', error)
  }
}

export async function getAuditLogs(params: {
  hotelId: number
  entity?: string
  entityId?: number
  limit?: number
}) {
  const { hotelId, entity, entityId, limit = 100 } = params

  return prisma.auditLog.findMany({
    where: {
      hotelId,
      ...(entity && { entity }),
      ...(entityId && { entityId }),
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })
}

