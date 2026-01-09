# Quick Start - Return to Project

**Last worked on:** January 9, 2026

## 🚨 Current Status
Website deployed to Vercel but **NOT LOADING** - needs database setup.

## 🎯 What You Need to Do (10 minutes)

### Step 1: Choose a Database
Pick ONE option:
- **Option A:** Vercel Postgres ($5/month) - Easier
- **Option B:** Neon (FREE) - Requires manual setup

### Step 2: Set Up Database

#### If Vercel Postgres:
1. Go to https://vercel.com/dashboard
2. Click your project
3. Storage tab → Create Database → Postgres
4. Connect to project (all environments)
5. Done! Auto-redeploys

#### If Neon:
1. Sign up at https://neon.tech (free)
2. Create project: "blackandwhite"
3. Copy connection string
4. Add to Vercel: Settings → Environment Variables
   - Add: `POSTGRES_PRISMA_URL` (paste connection string)
   - Add: `POSTGRES_URL_NON_POOLING` (paste connection string)
   - Add: `POSTGRES_URL` (paste connection string)
   - Select: Production, Preview, Development for each
5. Redeploy from Deployments tab

### Step 3: Test
1. Visit your Vercel URL
2. Sign up with a new account
3. Create a game
4. It should work! 🎉

## 📄 Full Details
See **DEPLOYMENT_PROGRESS.md** for complete context and troubleshooting.

## 🆘 If Stuck
1. Check Vercel function logs (Deployments → Click deployment → View Function Logs)
2. Verify all 4 env vars exist: `JWT_SECRET` + 3 POSTGRES vars
3. Make sure database is in same region as Vercel deployment

---

**Repository:** https://github.com/urbanteams/blackandwhite
**Vercel Dashboard:** https://vercel.com/dashboard
