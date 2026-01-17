# Development Setup Guide

## Local Development with SQLite

For local development, the project uses SQLite for simplicity.

### Initial Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Create a `.env` file in the root directory:
```bash
# Database (SQLite for local development)
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="change-this-in-production-use-random-string"
```

3. **Ensure SQLite in schema:**
The `prisma/schema.prisma` should have SQLite configured for local development:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

4. **Run database migrations:**
```bash
npx prisma migrate dev
```

5. **Start the development server:**
```bash
npm run dev
# Or on a different port:
npm run dev -- -p 3001
```

### Database Management

**Reset database (destructive):**
```bash
npx prisma migrate reset
```

**View database in Prisma Studio:**
```bash
npx prisma studio
```

**Generate Prisma Client after schema changes:**
```bash
npx prisma generate
```

## Switching Between SQLite (Dev) and PostgreSQL (Production)

### For Local Development (SQLite)

**prisma/schema.prisma:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**.env:**
```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-here"
```

### For Production Deployment (PostgreSQL)

**Before pushing to GitHub for Vercel deployment:**

1. **Update prisma/schema.prisma:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}
```

2. **Commit the PostgreSQL configuration:**
```bash
git add prisma/schema.prisma
git commit -m "Update schema for PostgreSQL production deployment"
git push origin main
```

3. **Vercel will automatically:**
   - Use PostgreSQL environment variables
   - Run `prisma migrate deploy`
   - Generate Prisma Client
   - Build the application

### Important Notes

⚠️ **Database Provider Mismatch:**
- If you see errors like "The table does not exist", ensure your `prisma/schema.prisma` provider matches your database
- SQLite for local development (`provider = "sqlite"`)
- PostgreSQL for Vercel deployment (`provider = "postgresql"`)

⚠️ **Migration Files:**
- Migrations are database-specific
- SQLite and PostgreSQL migrations are not interchangeable
- When switching providers, you may need to reset migrations

## Testing Chat Feature Locally

1. **Start the development server:**
```bash
npm run dev -- -p 3001
```

2. **Open two browser windows:**
   - Window 1: http://localhost:3001
   - Window 2: http://localhost:3001 (incognito/private mode)

3. **Create accounts in both windows:**
   - Sign up with different emails

4. **Create a multiplayer game:**
   - In Window 1: Create multiplayer game
   - Note the room code

5. **Join the game:**
   - In Window 2: Join with the room code

6. **Test chat:**
   - Send messages in both windows
   - Messages should appear in real-time (2-second polling)
   - Chat only works in multiplayer games (not AI games)

## Common Issues

### "Internal Server Error" when sending chat messages

**Cause:** Database doesn't have ChatMessage table

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# If that doesn't work, reset and migrate:
npx prisma migrate reset
npx prisma migrate dev
```

### Chat input text is grey/invisible

**Fixed:** Chat input now uses `text-black` class

### Database locked errors

**Solution:** Stop all running Node processes:
```bash
# Windows:
taskkill //F //IM node.exe

# Mac/Linux:
pkill -f "next dev"
```

## Project Structure

```
blackandwhite/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication routes
│   │   └── game/          # Game and chat routes
│   ├── game/[gameId]/     # Game page
│   └── auth/              # Auth pages
├── components/
│   ├── game/              # Game UI components
│   │   ├── ChatSidebar.tsx
│   │   ├── GameBoard.tsx
│   │   └── ...
│   └── ui/                # Reusable UI components
├── lib/
│   ├── auth.ts            # Authentication utilities
│   ├── prisma.ts          # Prisma client
│   ├── game/
│   │   ├── game-logic.ts
│   │   ├── game-cleanup.ts
│   │   └── ai-opponent.ts
│   └── contexts/          # React contexts
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Migration files
├── .env                   # Local environment variables
└── dev.db                 # SQLite database (gitignored)
```

## Environment Variables

### Required for Local Development
```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="any-random-string"
```

### Required for Vercel Production
```bash
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
JWT_SECRET="secure-random-string"
```

## Development Workflow

1. Make code changes
2. Test locally with SQLite
3. Before deploying:
   - Update `schema.prisma` to PostgreSQL
   - Commit and push to GitHub
4. Vercel automatically deploys
5. After deployment, revert `schema.prisma` to SQLite for continued local development

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Guide](./DEPLOYMENT.md)
