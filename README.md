# Hivon: AI-Powered Publishing Platform

Hivon is a high-performance, full-stack blogging platform built with Next.js and Supabase. It features an integrated AI summarization engine powered by Google Gemini, designed to provide concise "AI Insights" for every story.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components)
- **Database & Auth**: Supabase (PostgreSQL + GoTrue)
- **AI Engine**: Google Gemini Pro 1.5
- **Styling**: Tailwind CSS v4 (Minimalist/Notion Aesthetic)
- **Type Safety**: TypeScript

---

## 🚀 Core Features

### 👤 Identity & Role-Based Access Control (RBAC)
Implemented a granular permission system with three distinct tiers:
- **Viewer**: Can read, like, and participate in discussions.
- **Author**: Can create and manage their own stories.
- **Admin**: Full system oversight, including moderation and global content management.

### ✍️ Intelligent Content Engine
- **AI Summarization**: Every post undergoes an automated analysis via Gemini to generate a summary. This reduces reader cognitive load while maintaining the author's original intent.
- **Performance-First CRUD**: Optimized data fetching using Next.js Server Components and selective client-side hydration for interactions.

### 🔍 Discovery & Interaction
- **Full-Text Search**: Client-side filtering combined with server-side pagination for low-latency discovery.
- **Discussion System**: Nested comment threads with real-time optimistic updates and administrative moderation tools.
- **Engagement Metrics**: Dynamic like system with debounce logic and state synchronization.

---

## 🧠 AI Strategy & Cost Optimization

### Gemini Integration
The AI summarizes content during the post creation/edit lifecycle. Instead of real-time generation on every read, summaries are persisted in the database.

### Optimization Techniques
- **Token Efficiency**: System prompts are highly specific to enforce concise output, minimizing token consumption and associated latency.
- **Caching**: AI summaries are stored in the `posts` table, ensuring $0 incremental cost for repeat readers.
- **Trigger-Based Generation**: Summarization only triggers on significant content changes (debounced or save-point based) to avoid redundant API calls.

---

## 🪜 Feature Logic & Architecture

- **Hydration Resilience**: Implemented the "Mounted State Pattern" in navigation and interaction components to solve common SSR/Client mismatches caused by dynamic auth states.
- **Optimistic UI**: Likes and comments use optimistic state updates with immediate rollback handled on failed network requests.
- **Sanitized Rendering**: Used `isomorphic-dompurify` and custom escaping logic for the blog body to prevent XSS while allowing basic HTML formatting.

---

## 🚧 Engineering Challenges

- **Hydration Synchronization**: Reconciling server-rendered layouts with client-side authentication states in Next.js 15 was solved by deferring specific DOM branches until the client mount phase.
- **Supabase RBAC in SSR**: Since server components lack immediate access to the client-side session, a secure logic helper (`lib/rbac.ts`) was developed to validate permissions consistently across both RSC and Client components.

---

## ⚙️ Setup & Deployment

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

## 📜 Professional Note
This project was developed as a technical assessment focusing on clean architecture, minimal design aesthetics, and the practical application of LLMs in a product ecosystem.
