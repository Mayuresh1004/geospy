# 🛠️ Setup Guide

This guide walks you through setting up the SaaS MVP template from scratch.

Back to the **[Main README](./README.md)**  
Need help? Ask in **[Discussions](../../discussions)**

---

## Step 1: Supabase Setup

### Create a Project

1. Go to https://supabase.com
2. Create a new project
3. Wait for provisioning (2–3 minutes)
4. Go to **Project Settings → API**
5. Copy:
   - Project URL
   - Anon public key
   - Service role key

---

### Run Database Migrations

1. Open **SQL Editor** in Supabase
2. Run the SQL from:
scripts/init.sql


---

### Enable Email Authentication

1. Go to **Authentication → Providers**
2. Enable **Email**
3. Configure:
- Email templates (optional)
- Redirect URLs

---

## Step 2: Environment Variables

Create `.env` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

## Step 3: Install Dependencies

```
bun install
```

## Step 4: Run the Dev Server

```
bun run dev
```

Visit => http://localhost:3000

## Step 5: Test the App

- Authentication Flow
- Visit /signup
- Create an account
- Confirm email (if enabled)
- Log in at /login
- Ensure redirect to /dashboard

## Step 6: Deploy to Production

Check for build errors

```
bun run build
```

When this executes without any issues:

- Deploy with Vercel
- Push repo to GitHub
- Go to **[Vercel](https://vercel.com)**
- Import the repo
- Add environment variables

Post-Deployment Checklist

- [] Update Supabase redirect URLs

- [] Test signup + login

- [] Verify dashboard access

## Help and Support
- Ask questions in [Discussions](../../discussions)
- Check Supabase logs
- Open a GitHub Issue if blocked