# Hotel Management System MVP

A single-property hotel management system built with Next.js 14, Prisma, and PostgreSQL.

## Features

- **Authentication**: Admin and Employee roles
- **Rooms Management**: CRUD operations with status tracking
- **Availability Search**: Find available rooms by date range
- **Bookings**: Create, check-in, check-out, and cancel bookings
- **Services**: Manage add-on services (breakfast, laundry, etc.)
- **Payments**: Record payments with multiple payment methods
- **Dashboard**: Daily operations overview with KPIs
- **Reports**: Occupancy rates, revenue, and cancellations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Session-based with bcrypt
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up your environment variables:

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/hotel_db?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

3. Set up the database:

```bash
npx prisma db push
```

4. Seed the database with sample data:

```bash
npm run db:seed
```

This will create:
- Admin user (username: `admin`, password: `admin123`)
- Employee user (username: `employee`, password: `employee123`)
- 1 hotel with 20 rooms
- 5 services
- Sample bookings

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Credentials

- **Admin**: username: `admin`, password: `admin123`
- **Employee**: username: `employee`, password: `employee123`

## Project Structure

```
/app
  /(auth)
    /login          # Login page
  /dashboard        # Daily ops overview
  /rooms            # Room management
    /[id]           # Room details
  /bookings         # Booking management
    /new            # Create new booking
    /[id]           # Booking details
  /services         # Service management
  /reports          # Reports and KPIs
/api
  /auth             # Authentication endpoints
  /rooms            # Room CRUD
  /availability     # Availability search
  /bookings         # Booking CRUD and transitions
  /services         # Service CRUD
  /room-services    # Add services to bookings
  /payments         # Payment recording
  /reports          # Report generation
```

## Key Workflows

### Booking Flow

1. Search for available rooms by date range
2. Select a room and enter guest information
3. Create booking (status: `booked`)
4. Check-in: Update booking to `checked_in`, room to `occupied`
5. Add services during stay (optional)
6. Check-out: Update booking to `completed`, room to `vacant_dirty`
7. Record payments
8. Housekeeping: Update room from `vacant_dirty` to `vacant_clean`

### Room Status Flow

- `vacant_clean` → Available for booking
- `reserved` → Booked but not checked in
- `occupied` → Guest checked in
- `vacant_dirty` → After check-out, needs cleaning
- `out_of_service` → Maintenance required

## Database Schema

The system uses the following core entities:

- **Users**: Admin, Employee, Customer roles
- **Hotels**: Single property (MVP)
- **Rooms**: With status tracking
- **Bookings**: Guest reservations
- **Services**: Add-on services
- **RoomServiceLog**: Services added to bookings
- **Payments**: Payment records
- **Employees**: Staff management

## Development

### Database Commands

```bash
# Push schema changes
npm run db:push

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

## Future Enhancements (Out of Scope for MVP)

- Multi-hotel management
- Advanced accounting/invoicing
- Loyalty programs
- Channel integrations (Booking.com, etc.)
- Staff scheduling
- Guest portal / online self-booking

## License

MIT

