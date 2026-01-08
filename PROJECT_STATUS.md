# Black and White Game - Project Status

**Last Updated:** 2026-01-08
**Repository:** https://github.com/urbanteams/blackandwhite
**Status:** Phase 2 Complete - Backend Fully Functional ✅

---

## Executive Summary

Building a standalone web application for the "Black and White" strategic tile game from Korean show "The Genius". The game features:
- **AI Mode**: Play against random AI opponent
- **Multiplayer Mode**: Real-time multiplayer across devices using room codes and polling
- **Authentication**: JWT-based user accounts with bcrypt password hashing
- **Timer System**: 60-second move timer with auto-forfeit on timeout

### Current State
- ✅ **Phase 1 Complete**: Database schema, authentication utilities, core game logic, AI opponent
- ✅ **Phase 2 Complete**: All 9 API routes implemented and tested - backend fully functional!
- ⏳ **Phase 3 Pending**: Game context with React polling system
- ⏳ **Phase 4-5 Pending**: UI components and pages

### Recent Achievements
- ✅ Fixed database table recognition issue
- ✅ Implemented all 6 game API routes (join, polling, move, my-games, abandon)
- ✅ AI opponent automatically responds to player moves
- ✅ Information hiding working (opponent tile color only)
- ✅ Score calculation correct for both AI and multiplayer games
- ✅ Complete end-to-end testing of all routes

---

## Technology Stack

```json
{
  "framework": "Next.js 16.1.1 (App Router)",
  "runtime": "React 19.2.3",
  "database": "SQLite via Prisma 6.19.1",
  "authentication": "JWT (jose 6.1.3) + bcrypt 6.0.0",
  "styling": "Tailwind CSS 4",
  "language": "TypeScript 5"
}
```

---

## Game Rules (Reference)

1. Each player has tiles numbered 0-8
   - Even numbers (0, 2, 4, 6, 8) = BLACK tiles
   - Odd numbers (1, 3, 5, 7, 9) = WHITE tiles
2. Starting player chooses a tile
3. Opponent sees only the COLOR (not the number) before choosing their tile
4. Both tiles are revealed simultaneously
5. Higher number wins the round (1 point)
6. Used tiles are removed from both players' hands
7. Game lasts 9 rounds (all tiles used)
8. Player with most points wins
9. **Timer**: 60 seconds per move, auto-loss on timeout

---

## Architecture Overview

### Database Schema (Prisma)

**User Model:**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  player1Games Game[]  @relation("Player1Games")
  player2Games Game[]  @relation("Player2Games")
  moves        Move[]
}
```

**Game Model:**
```prisma
model Game {
  id            String   @id @default(cuid())
  roomCode      String   @unique           // 6-char alphanumeric
  gameMode      String                     // "AI" | "MULTIPLAYER"
  status        String                     // "WAITING" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED"
  currentTurn   String?                    // userId
  currentRound  Int      @default(1)      // 1-9
  winnerId      String?
  player1Id     String
  player2Id     String?                    // null for AI games
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  player1       User     @relation("Player1Games", ...)
  player2       User?    @relation("Player2Games", ...)
  moves         Move[]

  @@index([roomCode, status, player1Id, player2Id])
}
```

**Move Model:**
```prisma
model Move {
  id           String   @id @default(cuid())
  gameId       String
  round        Int                         // 1-9
  playerId     String
  tileNumber   Int                        // 0-8
  createdAt    DateTime @default(now())

  game         Game     @relation(...)
  player       User     @relation(...)

  @@index([gameId, round, playerId])
}
```

### Authentication Flow

1. **Signup**: POST /api/auth/signup → bcrypt hash password → create User → create JWT session cookie
2. **Login**: POST /api/auth/login → verify password → create JWT session cookie
3. **Session**: httpOnly cookie with 7-day expiration
4. **Protected Routes**: All `/api/game/*` routes check session via `getSession()`

### Multiplayer Architecture

- **Polling-based**: Client polls GET /api/game/[gameId] every 1 second
- **Room Codes**: 6-character alphanumeric codes for matchmaking
- **Turn-based**: Server enforces turns via `currentTurn` field
- **Information Hiding**: API only reveals opponent tile COLOR until round completes

---

## Implementation Status

### Phase 1: Database & Core Logic ✅ COMPLETED

**Files Created:**

1. **prisma/schema.prisma**
   - User, Game, Move models with relations and indexes
   - Prisma 6 configuration (downgraded from v7)

2. **lib/auth.ts** (129 lines)
   - `createSession(userId, email)`: Creates JWT and sets httpOnly cookie
   - `getSession()`: Retrieves and validates session from cookie
   - `deleteSession()`: Removes session cookie
   - `verifySession(request)`: Middleware-style session check

3. **lib/prisma.ts** (14 lines)
   - Prisma client singleton with global caching
   - Development logging enabled
   - Custom output path: `lib/generated/prisma`

4. **lib/game/game-logic.ts** (187 lines)
   - `determineRoundWinner(tile1, tile2)`: Compare tiles
   - `calculateGameScore(moves, playerId)`: Count wins
   - `getUsedTiles(moves, playerId)`: Track played tiles
   - `getRemainingTiles(usedTiles)`: Calculate available tiles
   - `getTileColor(tileNumber)`: "black" | "white"
   - `generateRoomCode()`: Unique 6-char code
   - `isValidTileMove(tileNumber, usedTiles)`: Validate moves
   - `validateMoveTimeout(game)`: Check 60s timer
   - `isGameComplete(currentRound)`: Check if 9 rounds played

5. **lib/game/ai-opponent.ts** (18 lines)
   - `generateAIMove(remainingTiles)`: Random selection from available tiles

**Database Migration:**
- ✅ Initial migration created and applied
- ✅ Database tables recreated and working
- ✅ All routes tested and functional

---

### Phase 2: API Routes ✅ COMPLETE (All 9 routes implemented and tested)

**Completed Routes:**

1. **POST /api/auth/signup/route.ts**
   - Validates email format and password length (min 6 chars)
   - Checks for existing user
   - Hashes password with bcrypt (10 rounds)
   - Creates user record
   - Establishes session
   - Returns: `{ user: { id, email } }`

2. **POST /api/auth/login/route.ts**
   - Validates credentials
   - Compares password with bcrypt
   - Creates session
   - Returns: `{ user: { id, email } }`

3. **POST /api/auth/logout/route.ts**
   - Deletes session cookie
   - Returns: `{ success: true }`

4. **POST /api/game/create/route.ts**
   - Requires authentication
   - Validates gameMode: "AI" | "MULTIPLAYER"
   - Generates unique room code
   - Creates game record
   - For AI mode: player2Id = null, status = IN_PROGRESS
   - For multiplayer: player2Id = null, status = WAITING
   - Returns: `{ gameId, roomCode, gameMode, status }`

5. **POST /api/game/join/route.ts** ✅
   - Join multiplayer game via room code
   - Validates room exists, is multiplayer, and is joinable
   - Updates player2Id and changes status to IN_PROGRESS
   - Returns: `{ gameId, roomCode, gameMode, status }`

6. **GET /api/game/[gameId]/route.ts** ✅ CRITICAL - Polling endpoint
   - Returns sanitized game state for authenticated player
   - Hides opponent tile NUMBER (shows COLOR only) for current round
   - Calculates scores, remaining tiles, time remaining
   - For AI games: finds AI opponent ID from moves
   - Response structure:
     ```typescript
     {
       game: { id, roomCode, status, currentTurn, currentRound, winnerId },
       playerState: {
         myTiles: number[],
         opponentTiles: number,      // count only
         myScore: number,
         opponentScore: number,
         isMyTurn: boolean,
         timeRemaining: number | null
       },
       currentRoundMoves: {
         myMove: { tileNumber } | null,
         opponentMove: { color: "black" | "white" } | null  // number hidden!
       },
       completedRounds: [{ round, player1Tile, player2Tile, winner }]
     }
     ```

7. **POST /api/game/[gameId]/move/route.ts** ✅ CRITICAL - Game logic
   - Validates move (correct turn, valid tile 0-8, not used, no timeout)
   - Creates Move record in database
   - Checks if both players moved this round:
     - Both moved: determines winner, advances round, checks game completion
     - One moved: switches turn to opponent
   - AI games: auto-generates AI move immediately after player move
   - Creates system AI user (ai@system.local) if needed
   - Returns: `{ success, roundComplete, gameComplete, roundWinner, aiMove? }`

8. **GET /api/game/my-games/route.ts** ✅
   - Lists all games where user is player1 or player2
   - Includes game metadata, opponent info, and turn status
   - For AI games: shows "AI Opponent" as opponent
   - Ordered by updatedAt (most recent first)
   - Returns: `{ games: [{ id, roomCode, gameMode, status, opponent, isMyTurn }] }`

9. **POST /api/game/[gameId]/abandon/route.ts** ✅
   - Forfeits current game
   - Sets status to "ABANDONED"
   - Sets winnerId to opponent (wins by forfeit)
   - Validates user is a player and game isn't already finished
   - Returns: `{ success: true, message: "Game abandoned..." }`

---

### Phase 3: Game Context ⏳ PENDING

**File: lib/contexts/game-context.tsx**

Provides:
- Game state from polling (1-second interval)
- `submitMove(tileNumber)` function
- `abandonGame()` function
- Auto-stop polling when game completes

---

### Phase 4: UI Components ⏳ PENDING

**Components to Create:**

1. **components/game/GameLobby.tsx** - Landing page
   - Mode selection (AI vs Multiplayer)
   - Create game button
   - Join game input (room code)
   - Active games list

2. **components/game/GameBoard.tsx** - Main game interface
   - Wraps with GameProvider
   - Orchestrates all child components
   - Displays turn indicator, timer, scores, tiles

3. **components/game/TileSelector.tsx** - Tile selection UI
   - Grid of buttons 0-8
   - Color coding (black/white)
   - Disable used tiles and wrong turn

4. **components/game/RoundHistory.tsx** - Completed rounds
   - Table showing both players' tiles
   - Winner indicators

5. **components/game/ScoreDisplay.tsx** - Current scores
   - Player names and points

6. **components/game/GameTimer.tsx** - Countdown timer
   - 60-second countdown
   - Red warning when < 10 seconds

7. **components/game/OpponentInfo.tsx** - Opponent status
   - Tile count remaining
   - Last move color (if current round)

8. **components/game/TurnIndicator.tsx** - Turn status
   - "Your turn" vs "Opponent's turn"

---

### Phase 5: Pages & Routing ⏳ PENDING

**Pages to Create:**

1. **app/page.tsx** - Home/lobby page
2. **app/game/[gameId]/page.tsx** - Active game page
3. **app/auth/login/page.tsx** - Login page
4. **app/auth/signup/page.tsx** - Signup page

---

## Current Technical Issues

### Issue #1: Database Table Recognition (ACTIVE)

**Problem:**
- Prisma migration reports success
- Database file created (68KB at ./dev.db)
- Tables not recognized: "The table `main.User` does not exist"
- Signup API returns 500 error

**Troubleshooting History:**

1. **Attempt 1 (COMPLETED)**: Downgraded Prisma 7 → Prisma 6
   - Removed adapter complexity (PrismaLibSql)
   - Simplified lib/prisma.ts
   - Updated schema.prisma to add back `url = env("DATABASE_URL")`
   - Ran migration successfully
   - Issue persists

2. **Attempt 2 (IN PROGRESS)**: Force database reset
   - Command: `npx prisma db push --force-reset --accept-data-loss`
   - Status: Awaiting execution (requires explicit user consent)
   - Expected outcome: Recreate all tables

**Next Steps:**
1. Run force-reset command with user consent
2. Verify tables exist: `sqlite3 dev.db ".tables"`
3. Restart dev server
4. Test signup API again

---

## Environment Configuration

**.env**
```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication (change in production!)
JWT_SECRET="change-this-in-production-use-random-string"
```

**Database Location:** `./dev.db` (68KB, tables need recreation)

**Dev Server:** http://localhost:3000

---

## Testing Status

### Manual Testing Plan

**Test 1: User Signup** ❌ FAILED
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```
Expected: 201 with user object
Actual: 500 "Internal server error" (table doesn't exist)

**Test 2: User Login** ⏳ PENDING
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

**Test 3: Create AI Game** ⏳ PENDING
```bash
curl -X POST http://localhost:3000/api/game/create \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"gameMode":"AI"}'
```

**Test 4: Create Multiplayer Game** ⏳ PENDING
```bash
curl -X POST http://localhost:3000/api/game/create \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"gameMode":"MULTIPLAYER"}'
```

See **TESTING_GUIDE.md** for comprehensive testing instructions.

---

## Critical Implementation Details

### Security: Information Hiding

The API must **NEVER** reveal opponent's tile number until the round is complete. Only the tile COLOR is visible.

**Example Sanitization (GET /api/game/[gameId]):**
```typescript
const opponentMove = currentRoundMoves.find(m => m.playerId !== session.userId);

if (opponentMove && currentRoundMoves.length < 2) {
  // Round incomplete - hide number!
  return {
    currentRoundMoves: {
      myMove: myMove ? { tileNumber: myMove.tileNumber } : null,
      opponentMove: { color: getTileColor(opponentMove.tileNumber) }  // Only color!
    }
  };
}
```

### AI Move Processing

When user makes a move in AI game, the server immediately generates and processes the AI's response move:

```typescript
// After user move in AI game
if (game.gameMode === 'AI' && updatedGame.currentTurn !== session.userId) {
  const aiUsedTiles = getUsedTiles(allMoves, game.player2Id);
  const aiRemainingTiles = getRemainingTiles(aiUsedTiles);
  const aiTile = generateAIMove(aiRemainingTiles);

  await prisma.move.create({
    data: { gameId, round: updatedGame.currentRound, playerId: game.player2Id, tileNumber: aiTile }
  });

  // Re-run round completion logic
}
```

### Move Timer Enforcement

**Server-side:**
```typescript
function checkMoveTimeout(game: Game): boolean {
  const lastMove = game.moves
    .filter(m => m.round === game.currentRound)
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  const timeElapsed = Date.now() - (lastMove?.createdAt || game.updatedAt);
  return timeElapsed > 60000; // 60 seconds
}

// If timeout: forfeit game to opponent
```

**Client-side countdown:**
```typescript
const interval = setInterval(() => {
  const elapsed = Date.now() - game.lastMoveTime;
  const remaining = Math.max(0, 60 - Math.floor(elapsed / 1000));
  setTimeRemaining(remaining);
}, 100); // Update every 100ms
```

---

## File Organization

```
blackandwhite/
├── app/
│   ├── page.tsx                           # [PENDING] Home/lobby
│   ├── game/[gameId]/page.tsx             # [PENDING] Game page
│   ├── auth/
│   │   ├── login/page.tsx                 # [PENDING] Login
│   │   └── signup/page.tsx                # [PENDING] Signup
│   └── api/
│       ├── auth/
│       │   ├── signup/route.ts            # ✅ DONE
│       │   ├── login/route.ts             # ✅ DONE
│       │   └── logout/route.ts            # ✅ DONE
│       └── game/
│           ├── create/route.ts            # ✅ DONE
│           ├── join/route.ts              # ⏳ PENDING
│           ├── my-games/route.ts          # ⏳ PENDING
│           └── [gameId]/
│               ├── route.ts               # ⏳ PENDING (polling)
│               ├── move/route.ts          # ⏳ PENDING (critical)
│               └── abandon/route.ts       # ⏳ PENDING
├── components/
│   ├── game/                              # [PENDING] All components
│   └── ui/                                # [PENDING] Reusable UI
├── lib/
│   ├── auth.ts                            # ✅ DONE
│   ├── prisma.ts                          # ✅ DONE
│   ├── game/
│   │   ├── game-logic.ts                  # ✅ DONE
│   │   └── ai-opponent.ts                 # ✅ DONE
│   └── contexts/
│       └── game-context.tsx               # [PENDING]
├── prisma/
│   ├── schema.prisma                      # ✅ DONE
│   ├── migrations/                        # ✅ Created (needs reset)
│   └── dev.db                             # ❌ Tables not recognized
├── .env                                   # ✅ DONE
├── PROJECT_STATUS.md                      # 📄 This file
└── TESTING_GUIDE.md                       # ✅ DONE

Total Files Created: 9 of ~30
Completion: ~30%
```

---

## Development Commands Reference

```bash
# Start dev server
npm run dev

# Database operations
npx prisma migrate dev --name <name>       # Create and apply migration
npx prisma migrate reset                   # Reset database (destructive)
npx prisma db push --force-reset           # Force recreate tables
npx prisma generate                        # Regenerate client
npx prisma studio                          # Open database GUI

# Database inspection
sqlite3 dev.db ".tables"                   # List tables
sqlite3 dev.db "SELECT * FROM User;"       # Query users
sqlite3 dev.db ".schema User"              # Show table schema

# Testing
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Build for production
npm run build
npm start
```

---

## Next Steps (Priority Order)

### Immediate (Blocking)
1. ✅ Fix database table recognition issue (force-reset)
2. ✅ Verify tables exist in SQLite
3. ✅ Test signup API successfully
4. ✅ Test login API
5. ✅ Test game creation API

### Short-term (Phase 2 Completion)
6. Implement POST /api/game/join
7. Implement GET /api/game/[gameId] (polling endpoint - CRITICAL)
8. Implement POST /api/game/[gameId]/move (game logic - CRITICAL)
9. Implement GET /api/game/my-games
10. Implement POST /api/game/[gameId]/abandon

### Medium-term (Phase 3-4)
11. Create GameContext with polling logic
12. Build all UI components
13. Test full game flow (AI mode)
14. Test full game flow (multiplayer mode)

### Long-term (Phase 5)
15. Create all pages and routing
16. Polish UI/UX
17. Deploy to production
18. Update README.md with deployment instructions

---

## Success Criteria

- [x] Database schema designed and migrated
- [x] Authentication system implemented
- [x] Core game logic implemented
- [x] AI opponent implemented
- [ ] All API routes tested and working
- [ ] Players can create and join games with room codes
- [ ] AI opponent makes valid random moves
- [ ] Multiplayer works across different devices
- [ ] Opponent tiles properly hidden (only color visible)
- [ ] Move timer enforced (60s, auto-forfeit)
- [ ] Clean, focused game UI
- [ ] Full game playable end-to-end

---

## Lessons Learned

### Prisma Version Issues
- **Problem**: Prisma 7 requires complex adapter setup for SQLite
- **Solution**: Downgraded to Prisma 6 for simpler configuration
- **Takeaway**: Use stable, well-documented versions for new projects

### Database Location Confusion
- **Problem**: Migrations created database in unexpected location
- **Solution**: Explicitly set DATABASE_URL="file:./dev.db" in .env
- **Takeaway**: Always verify actual database file location matches .env

### Persistence Over Documentation
- **Problem**: Initial instinct was to document issues rather than fix them
- **Solution**: User feedback emphasized systematic troubleshooting
- **Takeaway**: Try fixing issues 3 times before pivoting to alternative approaches

---

## Contact & Resources

- **Repository**: https://github.com/urbanteams/blackandwhite
- **Plan File**: C:\Users\ocean\.claude\plans\playful-jingling-pillow.md
- **Testing Guide**: ./TESTING_GUIDE.md
- **Database**: ./dev.db (SQLite)
- **Dev Server**: http://localhost:3000

---

**Last Updated:** 2026-01-08
**Next Review:** After database issue resolution and successful API testing
