# BACKEND SETUP - QUICK START GUIDE

## Prerequisites
- Node.js 22.x installed
- PowerShell terminal

## Setup Steps

### 1. Navigate to Backend Directory
```powershell
cd "d:\apps\TG mini updates\1\backend"
```

### 2. Generate Prisma Client
```powershell
npm exec prisma generate
```

### 3. Create Database & Run Migrations
```powershell
npm exec prisma migrate dev --name init
```

### 4. Start the Backend Server
```powershell
npm run dev
```

The server will start on **http://localhost:3001**

### 5. Test the Health Endpoint
Open a new terminal and run:
```powershell
curl http://localhost:3001/health
```

You should see: `{"status":"ok","timestamp":"..."}`

## Testing the Registration API

### Test with cURL (PowerShell)
```powershell
curl.exe -X POST http://localhost:3001/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"telegramId\":123456789,\"firstName\":\"Test User\",\"authMethod\":\"email\",\"email\":\"test@example.com\"}'
```

### Expected Response
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "telegramId": "123456789",
    "firstName": "Test User",
    "authMethod": "email",
    "email": "test@example.com"
  }
}
```

## Viewing the Database

To see registered users:
```powershell
npm exec prisma studio
```

This opens a browser interface to view/edit your database.

## Common Issues

**Error: Module '@prisma/client' not found**
- Solution: Run `npm exec prisma generate`

**Error: Database file doesn't exist**
- Solution: Run `npm exec prisma migrate dev --name init`

**Port 3001 already in use**
- Solution: Change PORT in `.env` file

## Next Steps

1. Keep backend running (`npm run dev`)
2. In a new terminal, start the frontend (`npm run dev` in root directory)
3. Open http://localhost:5173 and test the sign-up flow
4. Check database records with `npm exec prisma studio`

See [backend/README.md](file:///d:/apps/TG%20mini%20updates/1/backend/README.md) for full API documentation.
