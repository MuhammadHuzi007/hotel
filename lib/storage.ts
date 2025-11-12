import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true, // Required for MinIO
})

const BUCKET = process.env.S3_BUCKET || 'hotel-files'
const PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL || `http://localhost:9000/${BUCKET}`

// Ensure bucket exists
export async function ensureBucket() {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: '.keep',
      })
    )
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      // Bucket doesn't exist, but we'll let MinIO auto-create on first put
      console.log(`Bucket ${BUCKET} will be created on first upload`)
    }
  }
}

// Upload file to S3
export async function putFile(
  key: string,
  body: Buffer | string,
  contentType?: string,
  metadata?: Record<string, string>
): Promise<string> {
  await ensureBucket()

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  })

  await s3Client.send(command)
  return `${PUBLIC_BASE_URL}/${key}`
}

// Get signed URL for private file access
export async function getSignedUrlForFile(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

// Generate unique file key
export function generateFileKey(prefix: string, extension: string): string {
  const filename = `${uuidv4()}.${extension}`
  return `${prefix}/${filename}`
}

// Upload invoice PDF
export async function uploadInvoice(bookingId: number, pdfBuffer: Buffer): Promise<string> {
  const key = generateFileKey(`invoices/${bookingId}`, 'pdf')
  return putFile(key, pdfBuffer, 'application/pdf', {
    bookingId: bookingId.toString(),
    type: 'invoice',
  })
}

// Upload export CSV
export async function uploadExport(
  hotelId: number,
  type: string,
  csvContent: string
): Promise<string> {
  const key = generateFileKey(`exports/${hotelId}/${type}`, 'csv')
  return putFile(key, csvContent, 'text/csv', {
    hotelId: hotelId.toString(),
    type,
  })
}

