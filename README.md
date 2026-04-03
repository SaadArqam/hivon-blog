# Hivon Blog Platform

> A full-stack blogging platform built with Next.js 14, Supabase, and Google Gemini AI — featuring role-based access control, AI-generated post summaries, nested comments, and a live admin dashboard.

---

## Live Demo

**https://hivon-blog-flax.vercel.app/** 

---

The full project report can be found in this repository for a comprehensive overview of the system.

📄 [View Technical Report](hivon_readme.pdf)

📄 [View Short Explanation Report](Hivon_Technical_Report.pdf))

## Features

- **Role-Based Access Control** — Three distinct roles: Author, Viewer, and Admin, enforced at UI, API route, and database (RLS) levels
- **AI-Powered Summaries** — Google Gemini automatically generates ~200-word summaries on post creation and stores them — zero repeated API calls
- **Nested Comments** — Reddit-style threaded replies with one level of nesting
- **Like System** — Heart-based post likes with optimistic UI updates
- **Image Uploads** — Featured images stored in Supabase Storage
- **Full-Text Search + Pagination** — Search posts by title with paginated results
- **Admin Dashboard** — Monitor all posts, comments, and users
- **Author Dashboard** — Manage personal posts with draft/publish toggle
- **Reading Progress Bar** — Visual scroll indicator on post detail pages
- **Draft / Publish Toggle** — Save posts as drafts before publishing
- **Mobile Responsive** — Fully responsive layout with hamburger menu

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Authentication | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| AI Integration | Google Gemini API (gemini-1.5-flash) |
| Notifications | Sonner (toast) |
| Version Control | Git + GitHub |
| Deployment | Vercel |

---

## Architecture

```
Browser
  │
  ├──► Next.js App Router
  │       ├── page.tsx files       → Server Components (SSR, no waterfalls)
  │       ├── api/*/route.ts       → API Routes (backend logic, auth checks)
  │       └── middleware.ts        → Route protection by role
  │
  ├──► Supabase
  │       ├── Auth                 → Session management, JWT
  │       ├── PostgreSQL           → Users, Posts, Comments, Likes tables
  │       ├── Row Level Security   → Database-level access enforcement
  │       └── Storage              → Post featured images
  │
  └──► Google Gemini API
          └── gemini-1.5-flash     → ~200 word summary, generated once on publish
```

**Key design decisions:**
- App Router API routes serve as the backend — no separate Express server needed
- RLS policies enforce permissions at the database level, independent of application code
- AI summaries are generated exactly once on post creation and stored — never regenerated
- Server Components handle all data fetching to avoid client-side waterfall requests

---

## Database Schema

| Table | Fields |
|---|---|
| **users** | id, name, email, role (viewer/author/admin), created_at |
| **posts** | id, title, slug, body, image_url, summary, author_id, status, created_at, updated_at |
| **comments** | id, post_id, user_id, comment_text, reply_to_id, is_hidden, created_at |
| **likes** | id, post_id, user_id, created_at |

---

## User Roles

| Role | Permissions |
|---|---|
| **Viewer** | View posts, read AI summaries, comment, like posts |
| **Author** | All Viewer permissions + create posts, edit/delete own posts, author dashboard |
| **Admin** | All permissions + edit/delete any post, hide comments, full admin dashboard |

---

## Local Setup

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)
- A Google AI Studio API key (free)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/hivon-blog.git
cd hivon-blog
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:

```bash
cp .env.example .env.local
```

Fill in your values:

| Variable | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase → Settings → Data API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key | Supabase → Settings → Data API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key | Supabase → Settings → Data API |
| `GEMINI_API_KEY` | Google Gemini API key | aistudio.google.com |
| `NEXT_PUBLIC_APP_URL` | Your app URL | `http://localhost:3000` locally |

### 4. Set up Supabase

Run the following SQL in your Supabase SQL Editor (Settings → SQL Editor):

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null unique,
  role text not null default 'viewer' check (role in ('author', 'viewer', 'admin')),
  created_at timestamptz default now()
);

-- Posts table
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text not null unique,
  body text not null,
  image_url text,
  summary text,
  author_id uuid references public.users(id) on delete cascade,
  status text default 'published' check (status in ('draft', 'published')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comments table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  comment_text text not null,
  reply_to_id uuid references public.comments(id) on delete cascade,
  is_hidden boolean default false,
  created_at timestamptz default now()
);

-- Likes table
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;

-- RLS Policies
create policy "Users can view all profiles" on public.users for select using (true);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

create policy "Anyone can view published posts" on public.posts for select using (status = 'published');
create policy "Authors can create posts" on public.posts for insert with check (
  auth.uid() = author_id and
  exists (select 1 from public.users where id = auth.uid() and role in ('author', 'admin'))
);
create policy "Authors can edit own posts" on public.posts for update using (
  auth.uid() = author_id or
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
create policy "Authors can delete own posts" on public.posts for delete using (
  auth.uid() = author_id or
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

create policy "Anyone can view visible comments" on public.comments for select using (is_hidden = false);
create policy "Logged in users can comment" on public.comments for insert with check (auth.uid() = user_id);
create policy "Admins can hide comments" on public.comments for update using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

create policy "Anyone can view likes" on public.likes for select using (true);
create policy "Logged in users can like" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on public.likes for delete using (auth.uid() = user_id);
```

### 5. Set up Supabase Storage

In your Supabase dashboard → Storage → New Bucket:
- Name: `post-images`
- Public: ON

### 6. Run the development server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

##  Setup & Deployment

### Environment Variables
Create a `.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

### Local Development
1. Install dependencies: `npm install`
2. Run migrations: Use Supabase CLI or execute the `schema.sql` (if provided) in the SQL Editor.
3. Start the server: `npm run dev`

### Deployment
Optimized for **Vercel**. Ensure all environment variables are added to the Vercel dashboard. The project uses standard Build & Output settings.

---

## AI Tool Used

**Windsurf** (primary) + **GitHub Copilot** (secondary) + **Claude** (debugging + architecture)

Windsurf was chosen for its codebase-aware AI chat — unlike standard autocomplete, it understands the full project context across files. This was critical when wiring Supabase RLS policies with Next.js middleware and ensuring server vs. client component boundaries were respected. It significantly reduced boilerplate time while keeping architectural decisions in my control.

---

## Project Structure

```
hivon-blog/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (auth)/register/       # Register with role selection
│   ├── blog/[slug]/           # Post detail page
│   ├── blog/[slug]/edit/      # Edit post (author/admin only)
│   ├── blog/new/              # Create post (author/admin only)
│   ├── dashboard/admin/       # Admin dashboard
│   ├── dashboard/author/      # Author dashboard
│   ├── dashboard/reader/      # Reader activity page
│   ├── api/posts/             # POST create post + AI summary
│   ├── api/posts/[id]/        # PATCH update, DELETE post
│   ├── api/comments/          # GET/POST/PATCH comments
│   ├── api/likes/             # GET/POST/DELETE likes
│   └── page.tsx               # Home — search + pagination
├── components/
│   ├── Navbar.tsx             # Role-aware navigation
│   ├── PostCard.tsx           # Post preview with AI summary
│   ├── CommentSection.tsx     # Nested comments + replies
│   ├── LikeButton.tsx         # Optimistic like toggle
│   ├── DeletePostButton.tsx   # Confirmation dialog delete
│   ├── ReadingProgress.tsx    # Scroll progress bar
│   ├── CopyLinkButton.tsx     # Clipboard copy
│   └── RoleGuard.tsx          # Permission wrapper component
├── lib/
│   ├── supabase/client.ts     # Browser Supabase client
│   ├── supabase/server.ts     # Server Supabase client
│   ├── gemini.ts              # Gemini AI summary helper
│   └── utils.ts               # slugify, timeAgo, readingTime
├── hooks/
│   ├── useUser.ts             # Auth + role state hook
│   └── usePosts.ts            # Posts fetching hook
├── types/index.ts             # TypeScript type definitions
└── middleware.ts              # Server-side route protection
```

---

## Author

Built by Saad Arqam as part of the Hivon Automations internship selection process.
