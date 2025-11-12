# Quick Setup Guide

## Prerequisites

1. **Node.js 18+** installed
2. **PostgreSQL** database running

## Installation Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/hotel_db?schema=public"
   ```

   Replace `user`, `password`, `localhost`, `5432`, and `hotel_db` with your PostgreSQL credentials.

3. **Set up the database:**
   ```bash
   npx prisma db push
   ```

   This will create all the tables in your database.

4. **Seed the database:**
   ```bash
   npm run db:seed
   ```

   This creates:
   - Admin user: `admin` / `admin123`
   - Employee user: `employee` / `employee123`
   - 1 hotel with 20 rooms
   - 5 services
   - Sample bookings

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

   You'll be redirected to the login page. Use the admin credentials above.

## Troubleshooting

### Database Connection Issues

- Make sure PostgreSQL is running
- Verify your `DATABASE_URL` in `.env` is correct
- Check that the database exists (create it if needed: `CREATE DATABASE hotel_db;`)

### Prisma Issues

- If you get "Prisma Client not generated", run: `npx prisma generate`
- If schema changes, run: `npx prisma db push`

### Port Already in Use

- Change the port in `package.json` scripts or use: `PORT=3001 npm run dev`

## Next Steps

After setup, you can:

1. **View the dashboard** - See daily operations overview
2. **Manage rooms** - View and update room statuses
3. **Create bookings** - Search availability and create new bookings
4. **Check-in/out** - Manage guest check-ins and check-outs
5. **Add services** - Add services to bookings (breakfast, laundry, etc.)
6. **Record payments** - Track payments for bookings
7. **View reports** - See occupancy rates and revenue

## Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:push      # Push schema changes
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio (database GUI)
```

