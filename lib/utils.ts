/**
 * Safely converts a Prisma Decimal value to a number
 * Handles Decimal objects, strings, and numbers
 */
export function toNumber(value: any): number {
  if (value === null || value === undefined) {
    return 0
  }
  
  // If it's already a number, return it
  if (typeof value === 'number') {
    return value
  }
  
  // If it has toNumber method (Prisma Decimal object), use it
  if (typeof value.toNumber === 'function') {
    return value.toNumber()
  }
  
  // If it's a string, parse it
  if (typeof value === 'string') {
    return parseFloat(value) || 0
  }
  
  // Try to convert to number
  return Number(value) || 0
}

