import nodemailer from 'nodemailer'
import path from 'path'
import fs from 'fs/promises'

if (!process.env.SMTP_HOST) {
  console.warn('SMTP not configured - email functionality will be disabled')
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
})

const fromEmail = process.env.SMTP_FROM || 'Hotel Ops <no-reply@hotel.test>'

export async function sendBookingConfirmation(params: {
  to: string
  guestName: string
  bookingId: number
  hotelName: string
  checkIn: Date
  checkOut: Date
  roomNumber: string
  total: number
}) {
  if (!process.env.SMTP_HOST) {
    console.log('Email not sent (SMTP not configured):', params)
    return
  }

  const { to, guestName, bookingId, hotelName, checkIn, checkOut, roomNumber, total } = params

  await transporter.sendMail({
    from: fromEmail,
    to,
    subject: `Booking Confirmation #${bookingId}`,
    html: `
      <h2>Booking Confirmation</h2>
      <p>Dear ${guestName},</p>
      <p>Your booking has been confirmed!</p>
      <ul>
        <li><strong>Booking ID:</strong> #${bookingId}</li>
        <li><strong>Hotel:</strong> ${hotelName}</li>
        <li><strong>Room:</strong> ${roomNumber}</li>
        <li><strong>Check-in:</strong> ${checkIn.toLocaleDateString()}</li>
        <li><strong>Check-out:</strong> ${checkOut.toLocaleDateString()}</li>
        <li><strong>Total:</strong> $${total.toFixed(2)}</li>
      </ul>
      <p>We look forward to hosting you!</p>
    `,
    text: `
      Booking Confirmation #${bookingId}
      
      Dear ${guestName},
      
      Your booking has been confirmed!
      
      Hotel: ${hotelName}
      Room: ${roomNumber}
      Check-in: ${checkIn.toLocaleDateString()}
      Check-out: ${checkOut.toLocaleDateString()}
      Total: $${total.toFixed(2)}
      
      We look forward to hosting you!
    `,
  })
}

export async function sendReceipt(params: {
  to: string
  guestName: string
  bookingId: number
  paymentAmount: number
  paymentMethod: string
}) {
  if (!process.env.SMTP_HOST) {
    console.log('Email not sent (SMTP not configured):', params)
    return
  }

  const { to, guestName, bookingId, paymentAmount, paymentMethod } = params

  await transporter.sendMail({
    from: fromEmail,
    to,
    subject: `Payment Receipt - Booking #${bookingId}`,
    html: `
      <h2>Payment Receipt</h2>
      <p>Dear ${guestName},</p>
      <p>Thank you for your payment!</p>
      <ul>
        <li><strong>Booking ID:</strong> #${bookingId}</li>
        <li><strong>Amount:</strong> $${paymentAmount.toFixed(2)}</li>
        <li><strong>Payment Method:</strong> ${paymentMethod}</li>
      </ul>
    `,
  })
}

export async function sendInvoice(params: {
  to: string
  guestName: string
  bookingId: number
  invoiceNumber: string
  pdfPath: string
}) {
  if (!process.env.SMTP_HOST) {
    console.log('Email not sent (SMTP not configured):', params)
    return
  }

  const { to, guestName, bookingId, invoiceNumber, pdfPath } = params

  const pdfBuffer = await fs.readFile(pdfPath)

  await transporter.sendMail({
    from: fromEmail,
    to,
    subject: `Invoice ${invoiceNumber} - Booking #${bookingId}`,
    html: `
      <h2>Invoice</h2>
      <p>Dear ${guestName},</p>
      <p>Please find your invoice attached.</p>
      <ul>
        <li><strong>Invoice Number:</strong> ${invoiceNumber}</li>
        <li><strong>Booking ID:</strong> #${bookingId}</li>
      </ul>
    `,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  })
}

