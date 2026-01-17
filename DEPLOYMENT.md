# Vercel Deployment Guide

This guide explains how to deploy the Black & White game to Vercel.

## Prerequisites

1. GitHub repository connected to Vercel
2. Vercel Postgres database (or compatible PostgreSQL provider)

## Environment Variables

Configure the following environment variables in your Vercel project settings:

### Required Variables

```bash
# Database (Vercel Postgres)
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# Authentication
JWT_SECRET="your-secure-random-string-here"
```

### How to Set Up Vercel Postgres

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Click "Create Database" → "Postgres"
4. Follow the prompts to create your database
5. Vercel will automatically add `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` to your environment variables

### JWT Secret

Generate a secure random string for `JWT_SECRET`:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use any password generator with at least 32 characters
```

## Deployment Process

### Automatic Deployment (Recommended)

1. Push changes to your `main` branch on GitHub
2. Vercel automatically detects the push and starts deployment
3. The `vercel-build` script runs:
   - `prisma migrate deploy` - Applies database migrations
   - `prisma generate` - Generates Prisma Client
   - `next build` - Builds the Next.js application

### Manual Deployment

You can also trigger deployments manually from:
- Vercel dashboard → Deployments → "Redeploy"
- Git commit with `vercel --prod` CLI command

## Database Migrations

The first deployment will create all database tables automatically via `prisma migrate deploy`.

For subsequent schema changes:

1. Test locally with SQLite (optional)
2. Update `prisma/schema.prisma`
3. Commit and push to GitHub
4. Vercel will automatically run migrations during deployment

## Features Included

- ✅ Real-time chat for multiplayer games
- ✅ Automatic cleanup (keeps last 3 games per user)
- ✅ AI and multiplayer game modes
- ✅ User authentication with JWT
- ✅ PostgreSQL database with Prisma ORM

## Post-Deployment

After successful deployment:

1. Visit your Vercel deployment URL
2. Create a new account at `/auth/signup`
3. Test both AI and multiplayer game modes
4. Chat feature works only in multiplayer games

## Troubleshooting

### Build Failures

**Error: Database connection failed**
- Ensure `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` are set
- Check that Vercel Postgres database is created and connected

**Error: JWT_SECRET not found**
- Add `JWT_SECRET` environment variable in Vercel dashboard
- Redeploy after adding the variable

**Error: Prisma migration failed**
- Check Vercel build logs for specific migration errors
- Ensure database schema is compatible with PostgreSQL

### Runtime Issues

**Chat not working**
- Chat only works in multiplayer games, not AI games
- Check browser console for API errors
- Verify PostgreSQL connection is stable

**Game cleanup not working**
- Cleanup runs automatically after game completion
- Check Vercel function logs for errors

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Database | SQLite | PostgreSQL (Vercel) |
| Port | 3000 or 3001 | N/A (serverless) |
| Env File | `.env` | Vercel Dashboard |
| Migrations | `prisma migrate dev` | `prisma migrate deploy` |

## Support

For issues or questions:
- Check Vercel deployment logs
- Review Prisma migration status
- Verify environment variables are set correctly
