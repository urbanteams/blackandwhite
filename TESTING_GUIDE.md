# Black and White Game - Testing Guide

## What We've Built So Far ✅

### Phase 1: Database & Core Logic (COMPLETED)
- ✅ Prisma schema with User, Game, and Move models
- ✅ Authentication utilities (JWT + bcrypt)
- ✅ Core game logic functions (winner calculation, tile validation, etc.)
- ✅ AI opponent with random move generation
- ✅ Prisma client configuration

### Phase 2: API Routes (PARTIALLY COMPLETE)
- ✅ Authentication routes:
  - `POST /api/auth/signup` - Create new user account
  - `POST /api/auth/login` - Login with email/password
  - `POST /api/auth/logout` - Logout and clear session
- ✅ Game creation route:
  - `POST /api/game/create` - Create AI or multiplayer game
- ⏳ Still needed: join, polling, move, my-games routes

## Current Issue

There's a configuration issue with Prisma 7's database adapter that needs to be resolved. The database tables aren't being created properly.

## How to Fix and Test

### Step 1: Fix Prisma Configuration

The issue is likely in `lib/prisma.ts`. Try this simpler configuration:

```typescript
import { PrismaClient } from "@/lib/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

Then update `prisma/schema.prisma` to use the older Prisma format:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

And add back to `.env`:
```
DATABASE_URL="file:./prisma/dev.db"
```

### Step 2: Recreate Database

```bash
cd blackandwhite
rm -rf prisma/migrations prisma/dev.db
npx prisma migrate dev --name init
npx prisma generate
```

### Step 3: Start Dev Server

```bash
npm run dev
```

The server should start on `http://localhost:3000` (or 3001 if 3000 is taken).

## Manual Testing with curl

Once the server is running and database is working:

### Test 1: Create a User Account

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Expected Response** (201):
```json
{
  "user": {
    "id": "clxx...",
    "email": "test@example.com"
  }
}
```

### Test 2: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

**Expected Response** (200):
```json
{
  "user": {
    "id": "clxx...",
    "email": "test@example.com"
  }
}
```

The `-c cookies.txt` saves the session cookie for authenticated requests.

### Test 3: Create an AI Game

```bash
curl -X POST http://localhost:3000/api/game/create \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"gameMode":"AI"}'
```

**Expected Response** (201):
```json
{
  "gameId": "clxx...",
  "roomCode": "ABC123",
  "gameMode": "AI",
  "status": "IN_PROGRESS"
}
```

### Test 4: Create a Multiplayer Game

```bash
curl -X POST http://localhost:3000/api/game/create \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"gameMode":"MULTIPLAYER"}'
```

**Expected Response** (201):
```json
{
  "gameId": "clxx...",
  "roomCode": "XYZ789",
  "gameMode": "MULTIPLAYER",
  "status": "WAITING"
}
```

### Test 5: Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

**Expected Response** (200):
```json
{
  "success": true
}
```

## Testing in Browser

### Option 1: Using Browser DevTools

1. Open `http://localhost:3000` in your browser
2. Open DevTools (F12)
3. Go to Console tab
4. Run test commands:

```javascript
// Test signup
fetch('/api/auth/signup', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
}).then(r => r.json()).then(console.log)

// Test login
fetch('/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
}).then(r => r.json()).then(console.log)

// Test create game
fetch('/api/game/create', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({gameMode: 'AI'})
}).then(r => r.json()).then(console.log)
```

### Option 2: Using Postman or Thunder Client

1. Install Postman or Thunder Client (VS Code extension)
2. Create requests for each endpoint listed above
3. Make sure to save cookies between requests for authentication

## Verify Database

You can inspect the SQLite database directly:

```bash
cd blackandwhite
sqlite3 prisma/dev.db

# Inside sqlite3:
.tables                    # Show all tables
SELECT * FROM User;        # View users
SELECT * FROM Game;        # View games
SELECT * FROM Move;        # View moves
.exit
```

## Common Issues & Solutions

### Issue: "Internal server error" (500)

Check server logs in terminal for specific error. Common causes:
- Database not created properly
- Prisma client not generated
- Session/auth error

### Issue: "Unauthorized" (401)

You're not logged in. Make sure to:
1. Login first
2. Save and send cookies with requests
3. Check cookie expiration (7 days)

### Issue: "Port already in use"

Kill existing Node processes:
```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
pkill node
```

### Issue: Build errors

```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Next Steps for Full Implementation

### Remaining API Routes (Phase 2)
- `POST /api/game/join` - Join multiplayer game via room code
- `GET /api/game/[gameId]` - Get game state (polling endpoint)
- `POST /api/game/[gameId]/move` - Submit a tile move
- `GET /api/game/my-games` - List user's games

### Frontend (Phases 3-5)
- Game context with polling
- UI components (TileSelector, GameBoard, etc.)
- Pages (lobby, game)
- Timer implementation

## Architecture Summary

```
Client (Browser)
    ↓ HTTP Requests
Next.js API Routes (app/api/)
    ↓ Calls
Business Logic (lib/game/)
    ↓ Uses
Prisma Client
    ↓ Queries
SQLite Database (prisma/dev.db)
```

## Files Created

### Core Logic
- `lib/auth.ts` - JWT authentication
- `lib/prisma.ts` - Database client
- `lib/game/game-logic.ts` - Game rules
- `lib/game/ai-opponent.ts` - AI moves

### API Routes
- `app/api/auth/signup/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/game/create/route.ts`

### Database
- `prisma/schema.prisma` - Database schema
- `prisma/migrations/` - Migration history

## Questions?

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify the database was created with tables
3. Ensure environment variables are set correctly in `.env`
4. Try the curl commands to isolate whether it's a server or client issue
