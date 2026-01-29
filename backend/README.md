# IELTS Reading Mastery - Backend API

## Setup Instructions

### 1. Install Dependencies
Already done during automated setup.

### 2. Set up Prisma Database

Run these commands in PowerShell (from the `backend` directory):

```powershell
# Generate Prisma Client
npm exec prisma generate

# Create database and run migrations
npm exec prisma migrate dev --name init
```

### 3. Start the Server

```powershell
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will run on `http://localhost:3001`

## API Endpoints

### POST /api/auth/register
Register or update a user with their sign-up information.

**Request Body:**
```json
{
  "telegramId": 123456789,
  "username": "testuser",
  "firstName": "Test",
  "authMethod": "email",
  "email": "test@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "telegramId": "123456789",
    "username": "testuser",
    "firstName": "Test",
    "authMethod": "email",
    "email": "test@example.com",
    "phoneNumber": null,
    "createdAt": "2026-01-18T04:10:00.000Z",
    "lastActive": "2026-01-18T04:10:00.000Z"
  }
}
```

### GET /api/auth/user/:telegramId
Get user information by Telegram ID.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "telegramId": "123456789",
    "username": "testuser",
    "firstName": "Test",
    "authMethod": "email",
    "email": "test@example.com",
    "phoneNumber": null,
    "createdAt": "2026-01-18T04:10:00.000Z",
    "lastActive": "2026-01-18T04:10:00.000Z"
  }
}
```

### GET /health
Health check endpoint.

## Environment Variables

See `.env.example` for all required environment variables.

## Database

The backend uses SQLite for development (easy setup). To migrate to PostgreSQL for production:

1. Update `prisma/schema.prisma` datasource to use PostgreSQL
2. Update `DATABASE_URL` in `.env`
3. Run `npm exec prisma migrate dev` again
