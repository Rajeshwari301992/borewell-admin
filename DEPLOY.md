# Deployment Guide – S K Borewells

## Architecture

```
borewell-admin  (Next.js)  → Vercel          ← Admin + Customer portal + API
borewell-booking (React/Vite) → Vercel       ← Public booking form
Database: Supabase (PostgreSQL)
Email: Gmail SMTP (Nodemailer)
```

---

## Step 1 – Set up Supabase Database

1. Go to https://app.supabase.com → **New project**
2. Give it a name (e.g. `sk-borewells`), choose a region close to India
3. Once created, go to **SQL Editor → New Query**
4. Paste the contents of `supabase-schema.sql` and click **Run**
5. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (under "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 – Push code to GitHub

```bash
# In borewell-admin directory
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/borewell-admin.git
git push -u origin main

# In borewell-booking directory
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/borewell-booking.git
git push -u origin main
```

---

## Step 3 – Deploy borewell-admin to Vercel

1. Go to https://vercel.com → **Add New Project**
2. Import the `borewell-admin` GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Under **Environment Variables**, add all of these:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | https://xxxxx.supabase.co |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJ... |
| `SMTP_HOST` | smtp.gmail.com |
| `SMTP_PORT` | 587 |
| `SMTP_USER` | rajiramesh30@gmail.com |
| `SMTP_PASS` | lyyj jyca kbqg tqrn |
| `SMTP_FROM_EMAIL` | rajiramesh30@gmail.com |
| `SMTP_FROM_NAME` | S K Borewells |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | 918310008194 |
| `NEXT_PUBLIC_API_URL` | *(leave empty)* |

5. Click **Deploy**
6. Note your deployment URL, e.g. `https://borewell-admin.vercel.app`

---

## Step 4 – Deploy borewell-booking to Vercel

1. Go to https://vercel.com → **Add New Project**
2. Import the `borewell-booking` GitHub repository
3. Framework: **Vite** (auto-detected)
4. Under **Environment Variables**, add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | https://borewell-admin.vercel.app/api |

5. Click **Deploy**

---

## Step 5 – Migrate existing bookings (optional)

If you want to move bookings from `bookings-db.json` to Supabase:

1. Go to Supabase → **Table Editor → bookings**
2. Click **Import data** → upload a CSV

Or run this one-time migration script from your local machine:

```bash
node scripts/migrate-to-supabase.js
```

---

## Step 6 – Custom domain (optional)

In Vercel project settings → **Domains** → add your domain
(e.g. `admin.skborewells.in` or `booking.skborewells.in`)

---

## After Deployment

| URL | Purpose |
|---|---|
| `https://borewell-admin.vercel.app` | Admin login & customer portal |
| `https://borewell-admin.vercel.app/dashboard` | Admin dashboard |
| `https://borewell-admin.vercel.app/customer-dashboard` | Customer home |
| `https://borewell-admin.vercel.app/track-booking` | Public booking tracker |
| `https://borewell-booking.vercel.app` | Public booking form |

Admin login: username `admin` / password `123456`

---

## Auto-deploy on push

Every `git push` to `main` automatically re-deploys on Vercel. No manual steps needed.
