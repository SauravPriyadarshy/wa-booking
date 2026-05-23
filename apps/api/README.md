# WhatsApp Booking CRM - API

This is the backend service for the WhatsApp-first Booking + CRM platform. It is built with **NestJS**, **Prisma**, and **PostgreSQL**.

## Core Features
- **Multi-tenancy**: Isolated data for different businesses.
- **Booking Engine**: Sophisticated slot calculation logic including buffers and staff availability.
- **WhatsApp Integration**: Webhook ingestion from WhatsApp workers.
- **CRM Service**: Customer management and activity timelines.
- **Auth**: JWT-based authentication with role-based access control (SuperAdmin, BusinessAdmin, Staff).

## Getting Started

### 1. Environment Setup
Create a `.env` file in this directory with the following variables:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
JWT_SECRET="your_secret"
REDIS_URL="redis://localhost:6379"
WA_WORKER_URL="http://localhost:3100"
SUPERADMIN_USERNAME="admin"
SUPERADMIN_PASSWORD="password"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Initialization
```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed
```

### 4. Run the API
```bash
# development
npm run dev

# production
npm run start:prod
```

## API Documentation
- **Public Endpoints**: `/public/*` (Business info, slots, public booking).
- **Admin Endpoints**: `/appointments`, `/customers`, `/services`, `/staff`, `/settings`.
- **WhatsApp Endpoints**: `/wa/events` (Ingestion), `/whatsapp/status`.

## Demo Credentials
For local testing, refer to the root `User_Test_credential.md`.
- **Super Admin**: `admin` / `Test@123`
- **Business Admin**: `demo_admin` / `password123`
