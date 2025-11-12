import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create users
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@hotel.com',
      password: await hashPassword('admin123'),
      role: 'admin',
    },
  })

  const employee = await prisma.user.upsert({
    where: { username: 'employee' },
    update: {},
    create: {
      username: 'employee',
      email: 'employee@hotel.com',
      password: await hashPassword('employee123'),
      role: 'employee',
    },
  })

  console.log('Created users:', { admin: admin.username, employee: employee.username })

  // Create hotel
  let hotel = await prisma.hotel.findUnique({
    where: { id: 1 },
  })

  if (!hotel) {
    hotel = await prisma.hotel.create({
      data: {
        id: 1,
        name: 'Grand Hotel',
        address: '123 Main Street',
        city: 'New York',
        phone: '+1-555-0123',
      },
    })
  }

  console.log('Created hotel:', hotel.name)

  // Create second hotel for Phase 2/3
  let hotel2 = await prisma.hotel.findUnique({
    where: { id: 2 },
  })

  if (!hotel2) {
    hotel2 = await prisma.hotel.create({
      data: {
        id: 2,
        name: 'Seaside Resort',
        address: '456 Beach Boulevard',
        city: 'Miami',
        phone: '+1-555-0456',
      },
    })
  }

  console.log('Created hotel 2:', hotel2.name)

  // Phase 2: Create HotelMembers
  await prisma.hotelMember.upsert({
    where: {
      userId_hotelId: {
        userId: admin.id,
        hotelId: hotel.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      hotelId: hotel.id,
      role: 'admin',
    },
  })

  await prisma.hotelMember.upsert({
    where: {
      userId_hotelId: {
        userId: admin.id,
        hotelId: hotel2.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      hotelId: hotel2.id,
      role: 'admin',
    },
  })

  await prisma.hotelMember.upsert({
    where: {
      userId_hotelId: {
        userId: employee.id,
        hotelId: hotel.id,
      },
    },
    update: {},
    create: {
      userId: employee.id,
      hotelId: hotel.id,
      role: 'employee',
    },
  })

  console.log('Created hotel memberships')

  // Phase 2: Create RoomTypes
  const roomTypeData = [
    { name: 'Single', baseRate: 75, capacity: 1 },
    { name: 'Double', baseRate: 100, capacity: 2 },
    { name: 'Suite', baseRate: 150, capacity: 4 },
  ]

  const roomTypes = []
  for (const rtData of roomTypeData) {
    const rt = await prisma.roomType.upsert({
      where: {
        hotelId_name: {
          hotelId: hotel.id,
          name: rtData.name,
        },
      },
      update: {},
      create: {
        hotelId: hotel.id,
        ...rtData,
        desc: `Comfortable ${rtData.name.toLowerCase()} room`,
      },
    })
    roomTypes.push(rt)
  }

  console.log(`Created ${roomTypes.length} room types`)

  // Create rooms linked to room types
  const rooms = []
  for (let i = 1; i <= 20; i++) {
    const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)]
    const priceVariation = (Math.random() - 0.5) * 20

    const room = await prisma.room.upsert({
      where: {
        hotelId_roomNumber: {
          hotelId: hotel.id,
          roomNumber: `${Math.floor(i / 10)}${i % 10}`.padStart(3, '0'),
        },
      },
      update: {
        roomTypeId: roomType.id,
        pricePerNight: roomType.baseRate.toNumber() + priceVariation,
      },
      create: {
        hotelId: hotel.id,
        roomNumber: `${Math.floor(i / 10)}${i % 10}`.padStart(3, '0'),
        roomType: roomType.name.toLowerCase(), // Legacy field
        roomTypeId: roomType.id,
        pricePerNight: roomType.baseRate.toNumber() + priceVariation,
        status: i <= 15 ? 'vacant_clean' : i <= 18 ? 'occupied' : 'vacant_dirty',
      },
    })
    rooms.push(room)
  }

  console.log(`Created ${rooms.length} rooms`)

  // Create services
  const servicesData = [
    { name: 'Breakfast', price: 15.00 },
    { name: 'Laundry', price: 25.00 },
    { name: 'Room Service', price: 30.00 },
    { name: 'WiFi Premium', price: 10.00 },
    { name: 'Parking', price: 20.00 },
  ]

  const services = []
  for (const serviceData of servicesData) {
    const service = await prisma.service.create({
      data: {
        hotelId: hotel.id,
        ...serviceData,
      },
    })
    services.push(service)
  }

  console.log(`Created ${services.length} services`)

  // Phase 2: Create Seasons
  const today = new Date()
  const summerStart = new Date(today.getFullYear(), 5, 1) // June 1
  const summerEnd = new Date(today.getFullYear(), 7, 31) // August 31
  const winterStart = new Date(today.getFullYear(), 11, 1) // December 1
  const winterEnd = new Date(today.getFullYear() + 1, 1, 28) // February 28

  await prisma.season.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      hotelId: hotel.id,
      name: 'Summer Season',
      startDate: summerStart,
      endDate: summerEnd,
      rateDelta: 20.00,
      percentDelta: null,
    },
  })

  await prisma.season.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      hotelId: hotel.id,
      name: 'Winter Season',
      startDate: winterStart,
      endDate: winterEnd,
      rateDelta: -10.00,
      percentDelta: null,
    },
  })

  console.log('Created seasons')

  // Phase 2: Create RatePlans
  await prisma.ratePlan.upsert({
    where: {
      hotelId_name: {
        hotelId: hotel.id,
        name: 'Best Available Rate',
      },
    },
    update: {},
    create: {
      hotelId: hotel.id,
      name: 'Best Available Rate',
      refundable: true,
      minAdvanceDays: 0,
      weekendSurcharge: 15.00,
    },
  })

  await prisma.ratePlan.upsert({
    where: {
      hotelId_name: {
        hotelId: hotel.id,
        name: 'Non-Refundable',
      },
    },
    update: {},
    create: {
      hotelId: hotel.id,
      name: 'Non-Refundable',
      refundable: false,
      minAdvanceDays: 0,
      weekendSurcharge: null,
    },
  })

  console.log('Created rate plans')

  // Phase 2: Create Taxes
  await prisma.tax.upsert({
    where: {
      hotelId_name: {
        hotelId: hotel.id,
        name: 'City Tax',
      },
    },
    update: {},
    create: {
      hotelId: hotel.id,
      name: 'City Tax',
      percent: 10.00,
    },
  })

  await prisma.tax.upsert({
    where: {
      hotelId_name: {
        hotelId: hotel.id,
        name: 'Service Tax',
      },
    },
    update: {},
    create: {
      hotelId: hotel.id,
      name: 'Service Tax',
      percent: 5.00,
    },
  })

  console.log('Created taxes')

  // Phase 2: Create Fees
  await prisma.fee.upsert({
    where: {
      hotelId_name: {
        hotelId: hotel.id,
        name: 'Resort Fee',
      },
    },
    update: {},
    create: {
      hotelId: hotel.id,
      name: 'Resort Fee',
      amount: 25.00,
      perNight: false,
    },
  })

  console.log('Created fees')

  // Phase 3: Create ApiKey (hashed)
  const { createApiKey } = await import('../lib/apiKeys')
  const apiKeyResult = await createApiKey(hotel.id, 'Development API Key', admin.id)
  console.log(`Created API key: ${apiKeyResult.key.substring(0, 10)}... (store this securely!)`)

  // Phase 3: Create WebhookEndpoint
  await prisma.webhookEndpoint.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      hotelId: hotel.id,
      url: 'https://webhook.site/unique-id',
      secret: 'whsec_test_secret_123',
      isActive: true,
    },
  })

  console.log('Created webhook endpoint')

  // Phase 3: Create ExternalChannelLink (Mock OTA)
  for (const roomType of roomTypes) {
    await prisma.externalChannelLink.upsert({
      where: {
        id: roomType.id,
      },
      update: {},
      create: {
        hotelId: hotel.id,
        roomTypeId: roomType.id,
        externalId: `MOCK-${roomType.name.toUpperCase()}-${hotel.id}`,
        provider: 'mock_ota',
        isActive: true,
      },
    })
  }

  console.log('Created external channel links')

  // Phase 3: Create Allotments (next 60 days)
  const allotments = []
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)

  for (let day = 0; day < 60; day++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + day)

    for (const roomType of roomTypes) {
      const roomCount = rooms.filter(r => r.roomTypeId === roomType.id).length
      await prisma.allotment.upsert({
        where: {
          hotelId_roomTypeId_date: {
            hotelId: hotel.id,
            roomTypeId: roomType.id,
            date,
          },
        },
        update: {},
        create: {
          hotelId: hotel.id,
          roomTypeId: roomType.id,
          date,
          quantity: roomCount,
        },
      })
      allotments.push({ roomType: roomType.name, date, quantity: roomCount })
    }
  }

  console.log(`Created ${allotments.length} allotments`)

  // Phase 3: Create PricingRules
  await prisma.pricingRule.create({
    data: {
      hotelId: hotel.id,
      roomTypeId: null, // Applies to all room types
      name: 'High Occupancy Surcharge',
      minOccPct: 80,
      pct: 15,
      minRate: null,
      maxRate: null,
      active: true,
    },
  })

  await prisma.pricingRule.create({
    data: {
      hotelId: hotel.id,
      roomTypeId: roomTypes[0].id, // Single rooms only
      name: 'Single Room Discount',
      minOccPct: null,
      delta: -10.00,
      minRate: 50.00,
      maxRate: null,
      active: true,
    },
  })

  console.log('Created pricing rules')

  // Create some sample bookings (updated for Phase 2/3)
  const bookings = []

  for (let i = 0; i < 5; i++) {
    const checkIn = new Date(today)
    checkIn.setDate(checkIn.getDate() + i)
    const checkOut = new Date(checkIn)
    checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 3) + 1)

    const room = rooms[Math.floor(Math.random() * 15)] // Use first 15 rooms (vacant_clean)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    
    // Use room type base rate or room price
    const roomType = roomTypes.find(rt => rt.id === room.roomTypeId)
    const baseRate = roomType ? roomType.baseRate.toNumber() : room.pricePerNight.toNumber()
    const nightlyTotal = baseRate * nights

    // Calculate taxes and fees (simplified)
    const taxTotal = nightlyTotal * 0.15 // 15% total tax
    const feeTotal = 25.00 // Resort fee
    const serviceTotal = 0
    const grandTotal = nightlyTotal + taxTotal + feeTotal + serviceTotal

    const booking = await prisma.booking.create({
      data: {
        hotelId: hotel.id,
        roomId: room.id,
        guestName: `Guest ${i + 1}`,
        guestEmail: `guest${i + 1}@example.com`,
        guestPhone: `555-000${i + 1}`,
        checkIn,
        checkOut,
        channel: i === 4 ? 'mock_ota' : 'direct', // One booking from OTA
        externalRef: i === 4 ? 'MOCK-001' : null,
        nightlyTotal,
        taxTotal,
        feeTotal,
        serviceTotal,
        grandTotal,
        totalAmount: grandTotal, // Legacy field
        status: i < 2 ? 'checked_in' : 'booked',
      },
    })

    // Update room status for checked-in bookings
    if (i < 2) {
      await prisma.room.update({
        where: { id: room.id },
        data: { status: 'occupied' },
      })
    }

    bookings.push(booking)
  }

  console.log(`Created ${bookings.length} sample bookings`)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

