# Hivon Blog Platform

## Live Demo
[URL here]

## Features
- Role-based access control (Author / Viewer / Admin)
- AI-powered post summaries via Google Gemini
- Real-time comments with admin moderation
- Image uploads via Supabase Storage
- Full-text search + pagination
- Admin dashboard
- Draft / Publish toggle
- Mobile responsive

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Supabase Auth, Supabase Database |
| Storage | Supabase Storage (post-images bucket) |
| AI | Google Gemini API (gemini-1.5-flash) |
| UI/UX | Sonner toasts, responsive design |
| Deployment | PM2 + Nginx (VPS) |

## Architecture
Next.js App Router provides both frontend and backend through API routes, eliminating the need for a separate Express server. Supabase handles authentication, database, and file storage with Row Level Security (RLS) policies enforcing role-based access at the database level. Google Gemini generates AI summaries once during post creation to optimize costs. Middleware protects routes based on user roles, while server components minimize client-side data fetching waterfalls.

## Local Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:

| Variable | Description |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Your Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Your Supabase anonymous key |
| SUPABASE_SERVICE_ROLE_KEY | Your Supabase service role key |
| GEMINI_API_KEY | Your Google Gemini API key |
| NEXT_PUBLIC_APP_URL | Your application URL (e.g., http://localhost:3000) |

4. Run the development server: `npm run dev`
5. Open http://localhost:3000 in your browser

## Database Schema

### users table
| Field | Type | Description |
|---|---|---|
| id | uuid | Primary key (auth user ID) |
| name | text | User display name |
| email | text | User email address |
| role | enum | User role: 'viewer' | 'author' | 'admin' |
| created_at | timestamp | Account creation timestamp |

### posts table
| Field | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| title | text | Post title |
| slug | text | URL-friendly slug |
| body | text | Post content (markdown) |
| image_url | text | Featured image URL (nullable) |
| summary | text | AI-generated summary (nullable) |
| author_id | uuid | Foreign key to users.id |
| status | enum | Post status: 'draft' | 'published' |
| created_at | timestamp | Post creation timestamp |
| updated_at | timestamp | Last update timestamp |

### comments table
| Field | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| post_id | uuid | Foreign key to posts.id |
| user_id | uuid | Foreign key to users.id |
| comment_text | text | Comment content |
| is_hidden | boolean | Admin moderation flag |
| created_at | timestamp | Comment creation timestamp |

## Deployment

### PM2 + Nginx steps for VPS
1. Install Node.js and PM2 on your VPS
2. Clone and build the project:
   ```bash
   git clone <your-repo>
   cd hivon-blog
   npm install
   npm run build
   ```
3. Set up production environment variables
4. Start with PM2:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```
5. Configure Nginx to proxy to port 3000
6. Set up SSL certificate with Let's Encrypt

### ecosystem.config.js (PM2 config for VPS)
```javascript
module.exports = {
  apps: [{
    name: 'hivon-blog',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### nginx.conf snippet
```nginx
server {
    listen 80;
    server_name your-domain-or-ip;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### .env.example
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## AI Tool Used
Windsurf — chosen for its inline AI chat, codebase awareness, and ability to generate full files with context. It helped scaffold components, debug RLS policies, and speed up repetitive boilerplate like API routes.

## Key Technical Decisions
1. **Next.js App Router API routes as backend** - Eliminates need for separate Express server, reduces deployment complexity
2. **RLS policies for database-level role enforcement** - Security at the data layer prevents unauthorized access even if API routes are compromised
3. **AI summary generated ONCE on post creation and stored** - Minimizes API costs by never regenerating summaries on edits
4. **Server components for data fetching** - Avoids client-side waterfalls and improves initial page load performance
5. **Supabase Storage for images** - Provides scalable file storage with public URLs and built-in CDN

## Bugs Encountered
[Leave a placeholder — fill in a real bug you hit during development]
