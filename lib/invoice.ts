import PDFDocument from 'pdfkit'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { Decimal } from '@prisma/client/runtime/library'
import { toNumber } from './utils'

export interface InvoiceData {
  invoiceNumber: string
  bookingId: number
  hotelName: string
  hotelAddress: string
  hotelCity: string
  hotelPhone: string
  guestName: string
  guestEmail?: string
  guestPhone?: string
  checkIn: Date
  checkOut: Date
  roomNumber: string
  roomType?: string
  nightlyTotal: Decimal
  serviceTotal: Decimal
  taxTotal: Decimal
  feeTotal: Decimal
  grandTotal: Decimal
  services?: Array<{ name: string; quantity: number; price: Decimal }>
  payments?: Array<{ date: Date; amount: Decimal; method: string }>
}

export async function generateInvoice(data: InvoiceData): Promise<string> {
  // Ensure invoices directory exists
  const invoicesDir = path.join(process.cwd(), 'public', 'invoices')
  try {
    await fs.mkdir(invoicesDir, { recursive: true })
  } catch {
    // Directory might already exist
  }

  const filename = `invoice-${data.invoiceNumber}.pdf`
  const filepath = path.join(invoicesDir, filename)

  const doc = new PDFDocument({ margin: 50 })

  // Pipe to file
  const stream = fsSync.createWriteStream(filepath)
  doc.pipe(stream)

  // Header
  doc.fontSize(20).text(data.hotelName, { align: 'center' })
  doc.fontSize(12).text(data.hotelAddress, { align: 'center' })
  doc.text(`${data.hotelCity} | ${data.hotelPhone}`, { align: 'center' })
  doc.moveDown()

  // Invoice details
  doc.fontSize(16).text('INVOICE', { align: 'center' })
  doc.moveDown()

  doc.fontSize(10)
  doc.text(`Invoice Number: ${data.invoiceNumber}`, { continued: true, align: 'right' })
  doc.text(`Booking ID: #${data.bookingId}`, { align: 'right' })
  doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' })
  doc.moveDown()

  // Guest info
  doc.text('Bill To:', { underline: true })
  doc.text(data.guestName)
  if (data.guestEmail) doc.text(data.guestEmail)
  if (data.guestPhone) doc.text(data.guestPhone)
  doc.moveDown()

  // Booking details
  doc.text('Booking Details:', { underline: true })
  doc.text(`Room: ${data.roomNumber}${data.roomType ? ` (${data.roomType})` : ''}`)
  doc.text(`Check-in: ${data.checkIn.toLocaleDateString()}`)
  doc.text(`Check-out: ${data.checkOut.toLocaleDateString()}`)
  doc.moveDown()

  // Items
  doc.text('Items:', { underline: true })
  doc.moveDown(0.5)

  // Room charges
  const nights = Math.ceil((data.checkOut.getTime() - data.checkIn.getTime()) / (1000 * 60 * 60 * 24))
  doc.text(`Room Charges (${nights} nights)`, { continued: true })
  doc.text(`$${toNumber(data.nightlyTotal).toFixed(2)}`, { align: 'right' })

  // Services
  if (data.services && data.services.length > 0) {
    doc.moveDown(0.5)
    doc.text('Additional Services:', { underline: true })
    data.services.forEach(service => {
      doc.text(`${service.name} (x${service.quantity})`, { continued: true })
      doc.text(`$${toNumber(service.price).toFixed(2)}`, { align: 'right' })
    })
    doc.text('Services Subtotal', { continued: true })
    doc.text(`$${toNumber(data.serviceTotal).toFixed(2)}`, { align: 'right' })
  }

  doc.moveDown()

  // Totals
  doc.moveDown()
  doc.text('Subtotal', { continued: true })
  const subtotal = toNumber(data.nightlyTotal) + toNumber(data.serviceTotal)
  doc.text(`$${subtotal.toFixed(2)}`, { align: 'right' })

  if (toNumber(data.taxTotal) > 0) {
    doc.text('Taxes', { continued: true })
    doc.text(`$${toNumber(data.taxTotal).toFixed(2)}`, { align: 'right' })
  }

  if (toNumber(data.feeTotal) > 0) {
    doc.text('Fees', { continued: true })
    doc.text(`$${toNumber(data.feeTotal).toFixed(2)}`, { align: 'right' })
  }

  doc.moveDown(0.5)
  doc.fontSize(14).font('Helvetica-Bold')
  doc.text('Total', { continued: true })
  doc.text(`$${toNumber(data.grandTotal).toFixed(2)}`, { align: 'right' })
  doc.font('Helvetica').fontSize(10)

  // Payments
  if (data.payments && data.payments.length > 0) {
    doc.moveDown(2)
    doc.text('Payments:', { underline: true })
    data.payments.forEach(payment => {
      doc.text(`${payment.date.toLocaleDateString()} - ${payment.method}`, { continued: true })
      doc.text(`$${toNumber(payment.amount).toFixed(2)}`, { align: 'right' })
    })
    const totalPaid = data.payments.reduce((sum, p) => sum + toNumber(p.amount), 0)
    doc.moveDown(0.5)
    doc.text('Total Paid', { continued: true })
    doc.text(`$${totalPaid.toFixed(2)}`, { align: 'right' })
    doc.text('Balance Due', { continued: true })
    const balance = toNumber(data.grandTotal) - totalPaid
    doc.text(`$${Math.max(balance, 0).toFixed(2)}`, { align: 'right' })
  }

  // Footer
  doc.moveDown(3)
  doc.fontSize(8).text('Thank you for your business!', { align: 'center' })

  doc.end()

  // Wait for stream to finish
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve)
    stream.on('error', reject)
  })

  return `/invoices/${filename}`
}

