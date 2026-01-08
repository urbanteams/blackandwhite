# Black & White Game - Development Progress

## Project Overview
A strategic tile game from "The Genius" Korean show, built as a standalone Next.js web application. Players (human vs AI or multiplayer) each have tiles 0-8, playing them strategically over 9 rounds. Higher tile wins each round, but opponent only sees COLOR (not number) until round completes.

## Technology Stack
- Next.js 16.1.1 with App Router
- React 19
- Prisma 6 with SQLite
- JWT Authentication (jose library)
- Tailwind CSS

## Completed Features

### Authentication System
- **Files Created:**
  - `components/auth/LoginForm.tsx` - Email/password login
  - `components/auth/SignupForm.tsx` - User registration with password confirmation
  - `app/auth/login/page.tsx` - Login page
  - `app/auth/signup/page.tsx` - Signup page
- **Protected Routes:** Home page and game pages redirect to login if not authenticated
- **Logout:** Added logout button to GameLobby

### Game Logic Fixes
1. **Game Completion Bug (CRITICAL FIX)**
   - Changed `isGameComplete()` from `round > 9` to `round >= 9`
   - File: `lib/game/game-logic.ts:121`
   - Game now properly ends after round 9

2. **Winner Determination Bug (CRITICAL FIX)**
   - Fixed `calculateGameScore()` calls - added missing 4th parameter
   - File: `app/api/game/[gameId]/move/route.ts:166-177, 305-317`
   - Winner now correctly determined based on score (was showing ties incorrectly)

3. **AI Tile Counter Bug**
   - Fixed completedRounds loop to include round 9 when game complete
   - File: `app/api/game/[gameId]/route.ts:112-135`
   - AI tile count now accurately shows 9→8→7...→0

### Timer System
- **Auto-Forfeit on Timeout**
  - File: `app/api/game/[gameId]/route.ts:149-168`
  - Polling endpoint checks for 60-second timeout
  - Automatically sets game status to COMPLETED with opponent as winner
  - No more waiting indefinitely for timed-out players

### Turn Order Logic
- **Round Winner Goes First**
  - Winner of previous round plays first tile in next round
  - Implemented in both multiplayer and AI modes
  - File: `app/api/game/[gameId]/move/route.ts`

- **Tie Handling**
  - When round ends in tie, player who moved FIRST continues to move first
  - Determined by checking `createdAt` timestamps
  - Files: `app/api/game/[gameId]/move/route.ts:205-212, 357-367`

### UI/UX Improvements

1. **Text Visibility**
   - Changed all form and banner text from gray to black
   - Files: `LoginForm.tsx`, `SignupForm.tsx`, `GameBoard.tsx`

2. **Information Hiding (Strategic Gameplay)**
   - Tile numbers hidden during game, only revealed at end
   - Round History shows only round winner during gameplay
   - File: `components/game/RoundHistory.tsx`

3. **Tile Color Display**
   - Round History now always shows colored tile boxes (black/white)
   - Tile numbers only shown when game complete
   - Players can see color history without revealing strategy
   - File: `components/game/RoundHistory.tsx:53-72`

4. **Round History Size**
   - Increased from `max-h-64` (256px) to `max-h-[600px]`
   - Shows all 9 rounds without scrolling
   - File: `components/game/RoundHistory.tsx:30`

5. **Score Box Alignment**
   - Added `items-end` to grid and `min-h-[40px]` to labels
   - Blue and purple score boxes now perfectly aligned
   - File: `components/game/ScoreDisplay.tsx:28-39`

## Game Rules Implementation

### Core Mechanics
- 2 players each have tiles 0-8 (even=black, odd=white)
- Starting player chooses tile, opponent sees only COLOR before choosing
- Higher number wins the round (1 point)
- Used tiles not revealed until game completes
- 9 rounds total, most points wins
- 60-second timer per move, auto-forfeit on timeout

### AI Opponent
- Random tile selection from remaining tiles
- Auto-creates system user `ai@system.local` if needed
- Immediately generates AI move after human move
- If AI wins round, it auto-plays next round's first move

### Information Security
- Server-side sanitization ensures opponent tile numbers hidden
- Polling endpoint only reveals tile COLOR until round completes
- File: `app/api/game/[gameId]/route.ts:93-108`

## Database Schema

### Game Model
```prisma
model Game {
  id            String   @id @default(cuid())
  roomCode      String   @unique
  gameMode      String   // "AI" | "MULTIPLAYER"
  status        String   // "WAITING" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED"
  currentTurn   String?
  currentRound  Int      @default(1)
  winnerId      String?
  player1Id     String
  player2Id     String?  // null for AI games
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  player1       User     @relation("Player1Games")
  player2       User?    @relation("Player2Games")
  moves         Move[]
}
```

### Move Model
```prisma
model Move {
  id           String   @id @default(cuid())
  gameId       String
  round        Int
  playerId     String
  tileNumber   Int      // 0-8
  createdAt    DateTime @default(now())

  game         Game     @relation(...)
  player       User     @relation(...)
}
```

## API Endpoints

### Game Management
- `POST /api/game/create` - Create AI or multiplayer game
- `POST /api/game/join` - Join via room code
- `GET /api/game/[gameId]` - Poll game state (every 1 second)
- `POST /api/game/[gameId]/move` - Submit tile play
- `POST /api/game/[gameId]/abandon` - Forfeit game
- `GET /api/game/my-games` - List user's games

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

## Key Implementation Details

### Polling System
- Client polls every 1 second via `GameContext`
- Server calculates time remaining based on last move timestamp
- Auto-stops polling when game completes

### Move Validation
1. Check authentication
2. Verify tile number (0-8, integer)
3. Check game is IN_PROGRESS
4. Verify it's player's turn
5. Check for timeout
6. Validate tile hasn't been used
7. Create move
8. Process round completion if both players moved
9. Check game completion after 9 rounds
10. For AI games, auto-generate AI response

### Round Completion Logic
1. Determine round winner (higher tile number)
2. If game complete (round >= 9):
   - Calculate overall scores
   - Set winner
   - Mark game COMPLETED
3. If not complete:
   - Advance to next round
   - Set next turn (winner goes first, or first mover if tie)
   - For AI: auto-generate next move if AI goes first

## Testing Checklist
- [x] Authentication flow (signup/login/logout)
- [x] AI game creation and completion
- [x] Game ends after round 9
- [x] Winner correctly determined (5 vs 4 scenario)
- [x] AI tile counter shows correct remaining tiles
- [x] Timer auto-forfeits at 0 seconds
- [x] Round History shows tile colors during game
- [x] Tile numbers only shown at game end
- [x] Tie turn order maintains first mover advantage
- [x] Score boxes properly aligned
- [x] Round History shows all rounds without scrolling

## Known Issues
None currently reported.

## Future Enhancements (Not Implemented)
- Real-time multiplayer via WebSockets (currently uses polling)
- Game history and statistics
- Leaderboard
- Custom game settings (timer duration, number of rounds)
- Spectator mode
- Game replays

## Development Commands

### Database
```bash
npx prisma generate      # Regenerate Prisma client
npx prisma migrate dev   # Create and run new migrations
npm run db:reset         # Reset database (destructive)
```

### Development
```bash
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server
```

### Git
```bash
git add app/ components/ lib/
git commit -m "message"
git push origin main
```

## Important Files

### Core Game Logic
- `lib/game/game-logic.ts` - Pure functions for game rules
- `lib/game/ai-opponent.ts` - AI move generation

### API Routes
- `app/api/game/[gameId]/route.ts` - Polling endpoint (most important)
- `app/api/game/[gameId]/move/route.ts` - Move submission (complex logic)

### UI Components
- `components/game/GameBoard.tsx` - Main game interface
- `components/game/RoundHistory.tsx` - Round history display
- `components/game/TileSelector.tsx` - Tile selection UI
- `components/game/GameTimer.tsx` - Countdown timer

### Context
- `lib/contexts/game-context.tsx` - Game state management
- `lib/auth.ts` - JWT authentication utilities

## Git Commit History (Recent)
1. `de0ea16` - Update isGameComplete to check round >= 9 instead of > 9
2. `f612291` - Implement timer forfeit, show tile colors in history, and fix tie turn order
3. `dd6e8de` - Fix multiple game completion issues
4. `4356bb1` - Fix game completion logic - change round > 9 to round >= 9

## Session Summary
Started with "Unauthorized" error, resolved by implementing complete authentication system. Fixed critical bugs in game completion logic, winner determination, and AI tile counting. Implemented timer auto-forfeit, tile color display in history, and proper tie turn order handling. All UI issues resolved (text visibility, alignment, scroll height).

**Status:** All reported issues resolved. Game fully functional and ready for testing.
