# Steel City AI - Developer Guide

Complete technical reference for setting up, understanding, and developing alongside this codebase. Written so that another developer (or AI) can recreate the production environment locally and make compatible updates.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack Summary](#2-tech-stack-summary)
3. [Project Structure](#3-project-structure)
4. [Local Environment Setup](#4-local-environment-setup)
5. [Environment Variables](#5-environment-variables)
6. [Database Schema](#6-database-schema)
7. [Backend Architecture](#7-backend-architecture)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Authentication System](#9-authentication-system)
10. [Social Media Management Platform](#10-social-media-management-platform)
11. [AI Agent System](#11-ai-agent-system)
12. [Meta (Facebook/Instagram) OAuth & Publishing](#12-meta-facebookinstagram-oauth--publishing)
13. [Post Scheduler](#13-post-scheduler)
14. [URL Scraper](#14-url-scraper)
15. [Client Portal System](#15-client-portal-system)
16. [Automation Discovery System](#16-automation-discovery-system)
17. [Chatbot Configuration System](#17-chatbot-configuration-system)
18. [Stripe Billing Integration](#18-stripe-billing-integration)
19. [Google Workspace Integrations](#19-google-workspace-integrations)
20. [API Reference](#20-api-reference)
21. [Data Formats & Output Shapes](#21-data-formats--output-shapes)
22. [Critical Implementation Notes](#22-critical-implementation-notes)
23. [Build & Deployment](#23-build--deployment)
24. [Testing](#24-testing)

---

## 1. Project Overview

Steel City AI is a full-stack application that serves as:

- **Marketing Website**: Landing pages, service offerings, case studies, blog, careers, legal pages.
- **Automation Discovery System**: AI-powered questionnaire that generates personalized implementation outlines for potential clients.
- **Admin Portal** (`/admin`): Full CRM with client management, project tracking, support tickets, chat management, social media management, chatbot configuration, and automation discovery review.
- **Client Portal** (`/:clientSlug`): Per-client authenticated area with project views, AI usage tracking, billing (Stripe), support tickets, software updates, and a social media management platform with full admin feature parity.
- **AI-Powered Social Media Platform**: 5 specialized AI agents for research, content creation, design, review, and training — with autonomous mode, image/video generation, and multi-platform publishing.

---

## 2. Tech Stack Summary

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.x | UI framework |
| TypeScript | 5.6.x | Type safety |
| Vite | 5.4.x | Build tool & dev server |
| Wouter | 3.3.x | Client-side routing |
| Shadcn/ui + Radix UI | Latest | Component library |
| Tailwind CSS | 3.4.x | Styling |
| TanStack Query | 5.60.x | Server state management |
| React Hook Form | 7.55.x | Form handling |
| Zod | 3.25.x | Schema validation |
| Recharts | 2.15.x | Charts/analytics |
| Lucide React | 0.453.x | Icons |
| Framer Motion | 11.13.x | Animations |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Runtime |
| Express | 4.21.x | HTTP framework |
| TypeScript | 5.6.x | Type safety |
| Drizzle ORM | 0.39.x | Database ORM |
| PostgreSQL | 15+ | Database |
| `@neondatabase/serverless` | 0.10.x | Neon HTTP driver |
| `pg` (node-postgres) | Latest | TCP PostgreSQL driver |
| Passport.js | 0.7.x | Admin authentication |
| express-session | 1.18.x | Session management |
| connect-pg-simple | 10.x | PostgreSQL session store |
| Multer | 2.0.x | File uploads |
| Cheerio | 1.2.x | HTML scraping |
| OpenAI SDK | 6.10.x | Image generation fallback |
| `@google/genai` | 1.43.x | Gemini AI integration |
| Stripe | 20.x | Payment processing |

### External Services
| Service | Purpose | Required |
|---|---|---|
| PostgreSQL (Neon recommended) | Primary database | Yes |
| Google Gemini (via Replit AI Integrations) | All AI text generation, image generation | Yes |
| OpenAI (via Replit AI Integrations) | Fallback image generation (gpt-image-1) | Recommended |
| Meta/Facebook Developer App | Facebook/Instagram OAuth & publishing | For social media publishing |
| YouTube Data API v3 | YouTube Shorts search in research | Optional |
| Stripe | Client billing & subscriptions | For billing features |
| Cloudflare Turnstile | Bot protection on public forms | Recommended |
| Pexels API | Stock image/video search | Optional |
| Google Cloud (OAuth) | Gmail, Drive, Calendar, Sheets | Optional |
| Google Analytics 4 | Website analytics | Optional |
| inference.sh | Veo 3.1 Fast video generation with native audio (`google/veo-3-1-fast`) | For AI video with audio |

---

## 3. Project Structure

```
/
├── client/                          # Frontend (React + Vite)
│   ├── index.html                   # HTML entry point
│   └── src/
│       ├── main.tsx                 # React mount point
│       ├── App.tsx                  # Root component + routing
│       ├── index.css                # Global styles + CSS variables
│       ├── pages/
│       │   ├── Home.tsx             # Landing page
│       │   ├── Login.tsx            # Admin login
│       │   ├── AutomationDiscovery.tsx
│       │   ├── PitchDeck.tsx
│       │   ├── Blog.tsx, Careers.tsx, Privacy.tsx, Terms.tsx, etc.
│       │   ├── admin/               # Admin portal pages
│       │   │   ├── Dashboard.tsx
│       │   │   ├── ClientsPage.tsx
│       │   │   ├── ClientDetail.tsx
│       │   │   ├── ProjectDashboard.tsx
│       │   │   ├── ConsultationsPage.tsx
│       │   │   ├── SocialMediaPage.tsx       # Admin social media
│       │   │   ├── ChatManagementPage.tsx
│       │   │   ├── ChatbotSettingsPage.tsx
│       │   │   ├── SupportTicketsPage.tsx
│       │   │   └── AutomationDiscoveryAdmin.tsx
│       │   ├── portal/              # Client portal pages
│       │   │   ├── PortalLogin.tsx
│       │   │   ├── PortalLayout.tsx
│       │   │   ├── PortalDashboard.tsx
│       │   │   ├── PortalProjects.tsx
│       │   │   ├── PortalUsage.tsx
│       │   │   ├── PortalBilling.tsx
│       │   │   ├── PortalUpdates.tsx
│       │   │   ├── PortalSupport.tsx
│       │   │   └── PortalSocialMedia.tsx     # Client social media (admin parity)
│       │   └── services/            # Service detail pages
│       │       ├── DocumentProcessing.tsx
│       │       ├── CustomAgentAutomation.tsx
│       │       ├── MarketingAutomation.tsx
│       │       ├── DataAnalysis.tsx
│       │       └── CustomSolutions.tsx
│       ├── components/
│       │   ├── ui/                  # Shadcn/ui primitives (button, card, dialog, etc.)
│       │   ├── Header.tsx, Footer.tsx, Hero.tsx
│       │   ├── ChatWidget.tsx       # AI chatbot widget
│       │   ├── SocialPostPreview.tsx # Platform-specific post previews
│       │   ├── ConsultationForm.tsx
│       │   ├── ThemeProvider.tsx, ThemeToggle.tsx
│       │   ├── SEO.tsx, StructuredData.tsx
│       │   └── TurnstileWidget.tsx
│       ├── lib/
│       │   ├── auth.tsx             # Auth context + ProtectedRoute
│       │   ├── queryClient.ts       # TanStack Query config
│       │   ├── analytics.ts         # GA4 integration
│       │   └── utils.ts             # Utility functions (cn, etc.)
│       └── hooks/
│           ├── use-toast.ts
│           └── use-mobile.tsx
│
├── server/                          # Backend (Express)
│   ├── index.ts                     # Server entry point
│   ├── routes.ts                    # Core API routes
│   ├── social-media-routes.ts       # Social media API routes
│   ├── client-portal-routes.ts      # Client portal API routes
│   ├── storage.ts                   # Database layer (IStorage interface + implementation)
│   ├── vite.ts                      # Vite dev server integration (DO NOT MODIFY)
│   ├── turnstile.ts                 # Cloudflare Turnstile verification
│   ├── stripeClient.ts              # Stripe client initialization
│   ├── stripeService.ts             # Stripe business logic
│   ├── webhookHandlers.ts           # Stripe webhook handlers
│   ├── gmail.ts                     # Gmail utility functions
│   ├── services/
│   │   ├── ai-agents.ts             # AI Agent System (5 agents)
│   │   ├── meta-publisher.ts        # Facebook/Instagram OAuth + publishing
│   │   ├── post-scheduler.ts        # Scheduled post processor
│   │   ├── url-scraper.ts           # URL content/image scraper
│   │   ├── social-generator.ts      # Social content generation helpers
│   │   ├── google-auth.ts           # Google OAuth flow
│   │   ├── google-drive.ts          # Google Drive integration
│   │   ├── google-sheets.ts         # Google Sheets integration
│   │   ├── google-calendar.ts       # Google Calendar integration
│   │   └── google-gmail.ts          # Gmail integration
│   └── replit_integrations/         # Replit AI integration wrappers
│       ├── chat/                    # Chat completions (Gemini)
│       ├── image/                   # Image generation
│       └── batch/                   # Batch processing
│
├── shared/                          # Shared between frontend & backend
│   ├── schema.ts                    # Drizzle ORM schema + Zod schemas + types
│   └── models/
│       └── chat.ts                  # Chat-specific types
│
├── uploads/                         # User uploads (gitignored in production)
│   └── social-media/               # AI-generated images, videos, scraped images
│
├── migrations/                      # Drizzle migration files
│
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite configuration (DO NOT MODIFY)
├── drizzle.config.ts                # Drizzle ORM configuration (DO NOT MODIFY)
├── tailwind.config.ts               # Tailwind CSS configuration
├── postcss.config.js                # PostCSS configuration
└── replit.md                        # Project memory / architecture notes
```

---

## 4. Local Environment Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (local instance or Neon serverless)
- npm (comes with Node.js)
- ffmpeg (required for AI video generation)

### Steps

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL**
   Create a database. If using a local instance:
   ```bash
   createdb steelcityai
   ```

4. **Configure environment variables**
   Create a `.env` file in the project root (see [Section 5](#5-environment-variables) for all variables).

5. **Push database schema**
   ```bash
   npm run db:push
   ```
   If there are conflicts with existing tables:
   ```bash
   npm run db:push --force
   ```

6. **Create uploads directory**
   ```bash
   mkdir -p uploads/social-media
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```
   This starts both the Express backend and Vite dev server on port 5000.

### Default Credentials
- **Admin**: username `admin`, password `SteelCity2024!`
- **Client Portal (dev)**: `markrestelli.usa@gmail.com` / `MarkRestelli2024!` at `/markrestelli`

---

## 5. Environment Variables

### Required
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SESSION_SECRET=any-random-secure-string
```

### AI Services (via Replit AI Integrations or direct API keys)
```env
AI_INTEGRATIONS_GEMINI_API_KEY=your-gemini-api-key
AI_INTEGRATIONS_GEMINI_BASE_URL=https://generativelanguage.googleapis.com
AI_INTEGRATIONS_OPENAI_API_KEY=your-openai-api-key
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

### Meta/Facebook (for social media publishing)
```env
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### YouTube (for Shorts research)
```env
YOUTUBE_API_KEY=your-youtube-data-api-v3-key
```

### Cloudflare Turnstile (bot protection)
```env
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
```

### Pexels (stock media search)
```env
PEXELS_API_KEY=your-pexels-api-key
```

### Google Analytics
```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Google Workspace (optional)
```env
GOOGLE_OAUTH_SECRETS={"client_id":"...","client_secret":"...","redirect_uri":"..."}
```

### Stripe (optional, uses Replit Connectors in production)
Stripe is configured through Replit's connector system. Locally, you may need:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### inference.sh (AI video generation with audio)
```env
INFERENCE_API_KEY=your-inference-sh-api-key
```
When set, the server automatically installs the `infsh` CLI at startup (`~/.local/bin/infsh`) and maps `INFERENCE_API_KEY` → `INFSH_API_KEY` in the child process environment. The startup log will print `[STARTUP] inference.sh CLI ready at /home/runner/.local/bin/infsh`.

### Google Veo Video Generation (optional direct key)
```env
GEMINI_VEO_API_KEY=your-google-ai-api-key
```
Used specifically for the Veo 2 REST API fallback when inference.sh is unavailable.

### Replit-Specific (auto-populated in Replit environment)
```env
REPL_ID=...
REPL_SLUG=...
REPL_OWNER=...
REPLIT_DOMAINS=your-app.replit.app
REPLIT_DEPLOYMENT=1  # Set in production deployments
```

---

## 6. Database Schema

All tables are defined in `shared/schema.ts` using Drizzle ORM. The database is PostgreSQL.

### Key Design Decisions
- All primary keys are `varchar` with UUID defaults (`gen_random_uuid()`)
- Multi-tenant: most tables have a `clientId` foreign key for data isolation
- JSON columns use `jsonb` type for flexible metadata
- Array columns use `.array()` method (e.g., `text("platforms").array()`)

### Table Overview

#### Core Tables
| Table | Purpose |
|---|---|
| `users` | Admin users (Passport.js auth) |
| `clients` | Client organizations |
| `projects` | Client projects |
| `services` | Service catalog |
| `case_studies` | Marketing case studies |
| `contact_inquiries` | Lead capture (also holds consultations) |

#### Client Portal
| Table | Purpose |
|---|---|
| `client_portal_users` | Portal login credentials (bcrypt passwords) |
| `ai_usage_tracking` | Per-client AI usage metrics |
| `client_invoices` | Stripe invoice records |
| `software_updates` | Version/update announcements |
| `support_tickets` | Client support tickets |
| `support_messages` | Ticket thread messages |

#### Social Media
| Table | Purpose |
|---|---|
| `social_accounts` | Connected platform accounts (tokens, platform IDs) |
| `social_campaigns` | Campaign groupings |
| `social_posts` | Posts (draft, scheduled, published, failed) |
| `ai_agents` | Agent configurations (system prompts) |
| `ai_agent_tasks` | AI task execution log |
| `training_feedback` | User feedback on AI content |
| `brand_voice_profiles` | Brand voice settings per client |

#### Chat System
| Table | Purpose |
|---|---|
| `chat_sessions` | Live chat sessions |
| `chat_messages` | Individual messages |
| `chat_participants` | Session participants |
| `chatbot_config` | AI chatbot configuration |
| `chatbot_knowledge_base` | FAQ/knowledge entries |

#### Automation Discovery
| Table | Purpose |
|---|---|
| `automation_discovery_requests` | Multi-step questionnaire submissions with AI outlines |

#### Project Management
| Table | Purpose |
|---|---|
| `project_notes` | Notes on projects |
| `project_documents` | Uploaded documents |
| `project_milestones` | Milestone tracking |
| `project_deliverables` | Deliverable items per milestone |
| `project_status_updates` | Status update notifications |
| `project_dashboards` | Google Sheets dashboard links |

#### Google Integrations
| Table | Purpose |
|---|---|
| `google_integrations` | OAuth tokens for Google services |
| `google_sheets` | Linked spreadsheets |
| `google_drive_folders` | Linked Drive folders |
| `google_calendar` | Linked calendars |
| `google_calendar_events` | Synced calendar events |
| `gmail_threads` | Tracked email threads |
| `sync_logs` | Sync operation audit log |

### Type Exports Pattern
Every table in `shared/schema.ts` follows this pattern:
```typescript
// Table definition
export const myTable = pgTable("my_table", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  // ...
});

// Insert schema (Zod, omitting auto-generated fields)
export const insertMyTableSchema = createInsertSchema(myTable).omit({ id: true, createdAt: true });

// Types
export type InsertMyTable = z.infer<typeof insertMyTableSchema>;
export type MyTable = typeof myTable.$inferSelect;
```

---

## 7. Backend Architecture

### Entry Point: `server/index.ts`
1. Creates Express app
2. Configures session middleware with PostgreSQL store (falls back to memory store)
3. Initializes Passport.js for admin auth
4. Registers all route handlers
5. Sets up Vite dev server (development) or serves static files (production)
6. Starts the post scheduler
7. Listens on port 5000

### Storage Layer: `server/storage.ts`

**Critical: Two Drizzle Instances**

```typescript
// Neon HTTP driver - used for general queries
export const db = drizzle(neonSql);

// Node-postgres TCP driver - used for social media, chat, chatbot, and portal users
export const dbPg = drizzleNode(pgPool);
```

**Why two drivers?** The Neon HTTP driver fails for parameterized WHERE-clause queries against a local TCP PostgreSQL in development. The `pgPool` (node-postgres) driver works in both local dev and Neon production. All social media operations, chat operations, chatbot config operations, and `clientPortalUsers` queries use `dbPg`.

**Rule**: When adding new storage methods for social media or chat features, always use `dbPg`, never `db`.

The `IStorage` interface defines every CRUD method used by the application. The `DatabaseStorage` class implements all methods. There is no in-memory storage fallback for the current feature set.

### Route Files
- `server/routes.ts` - Core routes: auth, contacts, clients, projects, services, case studies, Google integrations, automation discovery, chatbot, admin support tickets
- `server/social-media-routes.ts` - Social media: accounts, campaigns, posts, AI generation, Meta OAuth, publishing, media upload
- `server/client-portal-routes.ts` - Portal: login/logout, dashboard, projects, usage, invoices, tickets, Stripe checkout

### Middleware
- `requireAuth` - Checks `req.isAuthenticated()` (Passport.js session) for admin routes
- `requirePortalAuth` - Checks `req.session.portalUser` for portal routes
- File uploads use Multer with disk storage to `uploads/` directories

---

## 8. Frontend Architecture

### Routing (`client/src/App.tsx`)

Uses Wouter for client-side routing. Key route patterns:

```
/                              → Home (landing page)
/services/*                    → Service detail pages
/automation-discovery          → AI questionnaire
/admin/login                   → Admin login
/admin                         → Admin dashboard
/admin/clients                 → Client management
/admin/clients/:id             → Client detail
/admin/social-media            → Social media management
/admin/chat                    → Chat management
/admin/chatbot-settings        → Chatbot configuration
/admin/support-tickets         → Support ticket management
/admin/automation-discovery    → Discovery request review
/:clientSlug                   → Client portal login
/:clientSlug/dashboard         → Client dashboard
/:clientSlug/social-media      → Client social media (admin parity)
/:clientSlug/projects          → Client projects
/:clientSlug/billing           → Client billing (Stripe)
/:clientSlug/support           → Client support tickets
/:clientSlug/usage             → AI usage tracking
/:clientSlug/updates           → Software updates
```

Admin routes are wrapped in `<ProtectedRoute>` (checks admin session).
Portal routes pass `clientSlug` as a prop.

### State Management
- **Server State**: TanStack Query v5 (object-form queries only)
  ```typescript
  // Correct
  useQuery({ queryKey: ['/api/admin/social/posts'], })
  // With variable key segments
  useQuery({ queryKey: ['/api/portal/social/posts', clientId] })
  ```
- **Client State**: React Context (auth, theme)
- **Mutations**: Use `apiRequest` from `@/lib/queryClient`, always invalidate cache after

### Import Aliases
```
@/*       → client/src/*
@shared/* → shared/*
@assets/* → attached_assets/*
```

### Design System
- Colors defined as CSS custom properties in `client/src/index.css` using `H S% L%` format
- Tailwind config references them as `hsl(var(--name) / <alpha-value>)`
- Dark mode via `.dark` class on `<html>` element
- Font: Inter (primary), DM Sans, Fira Code, Geist Mono

---

## 9. Authentication System

### Admin Auth
- **Technology**: Passport.js with local strategy
- **Session**: express-session with connect-pg-simple (PostgreSQL-backed)
- **Login**: `POST /api/auth/login` with `{ username, password }`
- **Password**: Stored as bcrypt hash in `users` table
- **Session cookie**: httpOnly, secure in production, 24-hour expiry
- **Protected routes**: `requireAuth` middleware checks `req.isAuthenticated()`

### Portal Auth
- **Technology**: Custom session-based auth (no Passport)
- **Login**: `POST /api/portal/login` with `{ email, password, clientSlug }`
- **Password**: Stored as bcrypt hash in `client_portal_users` table
- **Session data**: `req.session.portalUser = { id, clientId, email, name, role }`
- **Protected routes**: `requirePortalAuth` middleware checks `req.session.portalUser`
- **Data isolation**: All portal queries filter by `clientId` from the session

---

## 10. Social Media Management Platform

### Overview
Full social media management with AI-powered content creation, scheduling, and publishing to Facebook, Instagram, X/Twitter, LinkedIn, and YouTube.

### Architecture
- **Admin page**: `client/src/pages/admin/SocialMediaPage.tsx`
- **Portal page**: `client/src/pages/portal/PortalSocialMedia.tsx` (full admin parity)
- **Backend routes**: `server/social-media-routes.ts`
- **AI service**: `server/services/ai-agents.ts`
- **Publisher**: `server/services/meta-publisher.ts`
- **Scheduler**: `server/services/post-scheduler.ts`

### Tabs (both admin and portal)
1. **Dashboard** - Overview stats
2. **Posts** - All posts with status filters, create/edit/delete, publish now
3. **AI Compose** - AI content generation with multiple modes
4. **Campaigns** - Campaign CRUD
5. **Accounts** - Social account management + OAuth connect
6. **Brand Voice** - Brand voice profile CRUD
7. **Calendar** - Monthly calendar view of scheduled/published posts
8. **Analytics** - Engagement metrics, platform breakdown, best performers

### Post Statuses
- `draft` - Created but not scheduled
- `scheduled` - Has a `scheduledAt` datetime, will be auto-published
- `published` - Successfully published to platforms
- `failed` - Publishing attempt failed

### Post Data Shape
```typescript
{
  id: string,
  clientId: string | null,
  campaignId: string | null,
  content: string,
  mediaUrls: string[],        // Array of image/video URLs or paths
  platforms: string[],         // ["facebook", "instagram", "twitter", "linkedin", "youtube"]
  accountIds: string[],        // IDs of social_accounts to publish to
  status: "draft" | "scheduled" | "published" | "failed",
  scheduledAt: Date | null,
  publishedAt: Date | null,
  platformPostIds: Record<string, string> | null,  // { facebook: "post_id", instagram: "post_id" }
  platformOptions: Record<string, any> | null,
  hashtags: string[],
  aiGenerated: boolean,
  agentId: string | null,
  engagement: {               // Updated after publishing
    likes: number,
    shares: number,
    comments: number,
    reach: number
  } | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Media Storage
- Uploaded files saved to `uploads/social-media/` directory
- AI-generated images saved as PNG files
- AI-generated videos saved as MP4 files
- Media URLs in posts can be:
  - Relative paths: `/uploads/social-media/filename.png`
  - Full URLs: `https://example.com/image.jpg`
- `resolveMediaUrl()` in `meta-publisher.ts` converts relative paths to full public URLs for Facebook/Instagram API

---

## 11. AI Agent System

### File: `server/services/ai-agents.ts`

### 5 Specialized Agents
| Agent Role | Purpose |
|---|---|
| `management` | Orchestrates workflow between other agents |
| `research` | Trend research, hashtag discovery, optimal posting times |
| `design` | Visual art direction, image prompts, aspect ratios |
| `post` | Content writing, platform-specific versions |
| `training` | Editorial review, scoring, vibe edits |

### AI Models Used
- **Text generation**: `gemini-2.5-pro` (all social media AI)
- **Image generation**: `gemini-2.5-flash-image` (primary), `gpt-image-1` (OpenAI fallback)
- **Video generation**: 3-tier fallback chain (see below)

### Key Functions

#### `orchestrateContentCreation(briefing, platforms, clientId?, campaignId?, brandVoice?)`
Linear pipeline: Scrape URL (if present) → Research → Generate Post → Design Suggestions → Review

**Returns:**
```typescript
{
  research: { trends, suggestions, optimalTimes, youtubeShorts },
  content: string,
  hashtags: string[],
  platformVersions: Record<string, string>,
  designSuggestions: { image_prompt, aspect_ratio, style, ... },
  review: { score, feedback, revisedContent, approved_for_publish, ... },
  schedule?: { recommended_time, platform, reason }[]
}
```

#### `fullyAutonomousCreate(briefing, platforms, clientId?, campaignId?, brandVoice?)`
Extends orchestration + generates actual images/videos + determines schedule.

**Returns:** Same as orchestrate plus:
```typescript
{
  generatedImages: string[],   // File paths to generated images
  generatedVideos: string[],   // File paths to generated videos
  schedule: { recommended_time, platform, reason }[]
}
```

#### `generatePost(prompt, platforms, clientId?, campaignId?, brandVoice?)`
Generates platform-specific content from a briefing.

**Returns:**
```typescript
{
  content: string,
  hashtags: string[],
  platformVersions: Record<string, string>,  // { facebook: "...", instagram: "...", ... }
  suggestedMedia: string
}
```

#### `researchTrends(topic, platforms, clientId?)`
Researches trending topics, hashtags, and optimal posting times.

**Returns:**
```typescript
{
  trends: Array<{ topic, relevance, momentum }>,
  suggestions: string[],
  optimalTimes: Record<string, { time, reason }>,
  youtubeShorts: Array<{ title, url, relevance }>   // From YouTube Data API
}
```

#### `getDesignSuggestions(content, platforms, clientId?)`
Generates visual direction for content.

**Returns:**
```typescript
{
  image_prompt: string,
  aspect_ratio: string,
  style: string,
  color_palette: string[],
  recommendVideo: boolean,
  video_concept?: string
}
```

#### `reviewPost(content, platforms, clientId?, brandVoice?, topic?)`
Editorial review with scoring rubric.

**Returns:**
```typescript
{
  score: number,              // 1-10
  feedback: string,
  revisedContent: string,     // Improved version
  approved_for_publish: boolean,
  issues: string[],
  strengths: string[],
  rewritten_post?: string     // Only if score < 7
}
```

#### `applyVibeEdit(content, vibeDirection, clientId?)`
Adjusts tone/style based on natural language direction.

**Returns:**
```typescript
{
  editedContent: string,
  changes: string[]           // List of what changed
}
```

#### `generateImage(prompt, style?)`
Generates an image using Gemini 2.5 Flash Image (base64 response), falls back to OpenAI gpt-image-1.

**Returns:** `string` (file path like `/uploads/social-media/ai-gen-xxxxx.png`)

#### `generateVideo(prompt, scenePlan?)`
Generates a video using the 3-tier fallback chain below.

**Returns:** `string` (file path like `/uploads/social-media/ai-video-xxxxx.mp4`)

### Video Generation Tiers

`generateVideo()` in `server/services/ai-agents.ts` tries each tier in order and falls back automatically:

| Tier | Function | Model | Output | Requires |
|---|---|---|---|---|
| 1 (Primary) | `generateVideoInferenceSh()` | `google/veo-3-1-fast` via inference.sh CLI | Video **with native audio** | `INFERENCE_API_KEY` |
| 2 (Fallback) | `generateVideoVeo()` | `veo-2.0-generate-001` via Google REST API | Video only (no audio) | `GEMINI_VEO_API_KEY` or Gemini key |
| 3 (Last resort) | `generateVideoSlideshow()` | `gemini-2.5-pro` + `gemini-2.5-flash-image` + ffmpeg | Image slideshow with Ken Burns + crossfades | ffmpeg installed |

#### Tier 1: inference.sh Veo 3.1 Fast
- **CLI path**: `~/.local/bin/infsh`
- **Auto-bootstrap**: `ensureInfshCli()` installs the CLI on-demand via `curl -fsSL https://inference.sh/install.sh | sh`. Also called at server startup in `server/index.ts`.
- **Env mapping**: `INFERENCE_API_KEY` is mapped to `INFSH_API_KEY` in the child process env.
- **Job submission**: `infsh app run google/veo-3-1-fast --input <JSON> --no-wait` (non-blocking, uses `execFile` — no shell injection risk)
- **Polling**: `infsh task get <taskId> --json` every 10s for up to 5 minutes
- **Output**: Downloads MP4 from `output.videos[0]`, saves to `uploads/social-media/ai-infsh-video-<uuid>.mp4`
- **Logs**: `[AI VIDEO INFSH]` prefix

#### Tier 2: Google Veo 2 REST
- **Endpoint**: `POST https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning`
- **Polling**: Operation name checked every 10s for up to 5 minutes
- **Output**: Video URI at `operation.response.generateVideoResponse.generatedSamples[0].video.uri`

#### Tier 3: ffmpeg Slideshow
- Uses `gemini-2.5-pro` to plan 3–5 scenes; `gemini-2.5-flash-image` generates each scene image
- ffmpeg composites with Ken Burns (pan/zoom) effects and crossfade transitions
- Always available as last resort

#### CLI Bootstrap Details
`server/index.ts` calls `ensureInfshCli()` at startup when `INFERENCE_API_KEY` is present. This:
1. Checks if `~/.local/bin/infsh` exists
2. If not, runs the inference.sh installer shell script
3. Sets `INFSH_API_KEY` in `process.env` from `INFERENCE_API_KEY`
4. Logs `[STARTUP] inference.sh CLI ready at /home/runner/.local/bin/infsh`

### URL Scrape Integration
AI briefings can include URLs. The format `(scrape https://example.com)` triggers automatic scraping. The `extractScrapeUrl()` function detects this pattern. Scraped data (title, description, images, text content) is injected into the AI prompt as context.

### YouTube Shorts Integration
- Research agent automatically searches YouTube for relevant Shorts
- Results displayed in Research Findings card with manual "Add to Post" button
- Shorts are NOT automatically appended to AI-generated content
- Users choose which Shorts to include

### Brand Voice
When a `brandVoice` profile is provided, its `tone`, `style`, `vocabulary`, and `avoidWords` are injected into the AI prompt. Available for orchestrate, generate-post, and autonomous modes.

---

## 12. Meta (Facebook/Instagram) OAuth & Publishing

### File: `server/services/meta-publisher.ts`

### OAuth Flow
1. **Generate Auth URL** (`getOAuthUrl`): Creates Facebook login URL with scopes:
   - `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`
   - `pages_read_user_content`, `business_management`
   - `instagram_basic`, `instagram_content_publish`
   - Includes `auth_type=rerequest` to force fresh permission prompts

2. **Exchange Code** (`exchangeCodeForToken`): Temporary code → short-lived user token

3. **Upgrade Token** (`getLongLivedToken`): Short-lived → long-lived (60 days)

4. **Check Permissions** (`checkPermissions`): Audits granted/declined scopes

5. **Get Pages** (`getUserPages`): Fetches Page access tokens with 4 fallback strategies:
   - Strategy 1: Standard `/me/accounts` query
   - Strategy 2: Simplified fields (no instagram_business_account)
   - Strategy 3: `/me/businesses` → `/{businessId}/owned_pages` (Business Manager)
   - Strategy 4: `/me?fields=accounts` (user node approach)
   - Final: Token debug for diagnostics

### Publishing Flow

#### Facebook
- **Text-only**: POST to `/{pageId}/feed`
- **Single photo**: POST to `/{pageId}/photos` with `published=true`
- **Multi-photo (gallery)**: Upload each with `published=false`, then POST to `/{pageId}/feed` with `attached_media`
- **Video**: POST to `/{pageId}/videos` (detects by file extension: `.mp4`, `.mov`, `.avi`, `.webm`, etc.)

#### Instagram
- **Image required**: No text-only posts
- Container flow: POST `/{igUserId}/media` → POST `/{igUserId}/media_publish`

### BaseUrl Resolution
**Critical**: `metaPublisher.baseUrl` must be set before any publish call so relative `/uploads/...` paths resolve to full public URLs.

- **Admin/Portal routes**: Set from request headers: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host'] || req.headers.host}`
- **Post scheduler**: Set from `REPLIT_DOMAINS` env var: `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`

### Facebook App Requirements
- Valid OAuth Redirect URIs must include:
  - `/api/admin/social/meta/callback`
  - `/api/portal/social/meta/callback`
- App must have required permissions approved or be in development mode with test users

---

## 13. Post Scheduler

### File: `server/services/post-scheduler.ts`

- Runs on a 60-second interval (`setInterval`)
- Started automatically when the server boots
- Queries for posts where `status = 'scheduled'` and `scheduledAt <= now`
- Publishes to Facebook/Instagram via `metaPublisher.publishPost()`
- Updates post status to `published` or `failed`
- Sets `metaPublisher.baseUrl` from `REPLIT_DOMAINS` env var if not already set

---

## 14. URL Scraper

### File: `server/services/url-scraper.ts`

### Endpoints
- Admin: `POST /api/admin/social/scrape`
- Portal: `POST /api/portal/social/scrape`

### Request Body
```json
{ "url": "https://example.com" }
```

### Response Shape
```typescript
{
  url: string,
  title: string,
  description: string,
  textContent: string,        // First ~2000 chars of page text
  images: string[],           // Downloaded to uploads/social-media/, returned as /uploads/... paths
  price?: string,
  address?: string,
  details: Record<string, string>,
  metaTags: Record<string, string>
}
```

### Behavior
- Fetches page HTML with browser-like User-Agent
- Parses with Cheerio
- Downloads images locally (deduplicates by content hash)
- Extracts structured data (price, address) when available
- Scraped title/description can auto-fill AI briefing if empty

---

## 15. Client Portal System

### Access Pattern
Each client has a unique `slug` (e.g., `markrestelli`). Portal URLs are `/:clientSlug/*`.

### Authentication
- Login: `POST /api/portal/login` with `{ email, password, clientSlug }`
- Session stores `{ id, clientId, email, name, role }`
- All portal API routes verify `req.session.portalUser` exists
- All database queries filter by `clientId` from session (data isolation)

### Features
| Feature | Route | Description |
|---|---|---|
| Dashboard | `/:slug/dashboard` | Project overview, stats |
| Projects | `/:slug/projects` | Project list and details |
| Social Media | `/:slug/social-media` | Full social media platform (admin parity) |
| Billing | `/:slug/billing` | Stripe invoices, subscription management |
| Support | `/:slug/support` | Support ticket system |
| AI Usage | `/:slug/usage` | AI usage metrics |
| Updates | `/:slug/updates` | Software update announcements |

### Social Media Parity
The portal social media page (`PortalSocialMedia.tsx`) has identical functionality to admin (`SocialMediaPage.tsx`). The only difference is data isolation — all portal queries filter by the session's `clientId`.

**Tabs** (both admin and portal, in order):
1. Dashboard, 2. Posts, 3. AI Compose, 4. Campaigns, 5. Accounts, 6. Brand Voice, 7. Calendar, 8. Analytics

**Shared features:**
- Full AI workflow: orchestrate, autonomous, individual agents (research, design, post, review, vibe edit)
- AI Compose generates content with "Save as Draft" and "Create Post" buttons — no second step required
- Research Findings card: trending topics, suggestions, per-platform optimal posting times with platform icons, YouTube Shorts, "Apply Schedule" button
- Design Suggestions: image prompt + "Generate" button, visual suggestions (image/video type badges) with inline generation, color palette swatches
- Content Review: per-platform scores with dimension badges (Relevance, Clarity, Engagement, CTA), approved/needs-revision badge, revised content with "Use This" button
- Image and video generation (per-item "Generate" button in visual suggestions)
- Post create/edit/delete/publish/duplicate
- Facebook/Instagram OAuth connection (both `/api/admin/social/meta/*` and `/api/portal/social/meta/*` callback paths)
- Brand voice CRUD
- Campaign CRUD
- URL scraping
- Media upload
- Multi-day scheduling
- Auto-post toggle for autonomous mode

---

## 16. Automation Discovery System

### Public Form: `/automation-discovery`
Multi-step questionnaire collecting:
- Contact info, company details
- Process description, current tools
- Pain points, desired outcomes
- Budget, timeline, priority

### AI Processing
Submitting triggers two parallel AI outline generations:
1. **Gemini 3.1 Pro** (primary outline) → stored in `aiOutline` column
2. **Gemini 2.5 Pro** (comparison outline) → stored in `geminiOutline` column

### Admin Review: `/admin/automation-discovery`
- View all submissions with status tracking
- Side-by-side AI comparison with confidence indicators
- Points of agreement / discrepancy alerts
- "Merge Best of Both" button (Gemini 3.1 Pro) → stored in `mergedOutline`
- Convert to client + project

### Outline Data Shape
```typescript
{
  executiveSummary: string,
  currentStateAnalysis: string,
  proposedSolution: {
    overview: string,
    phases: Array<{
      name: string,
      duration: string,
      tasks: string[],
      deliverables: string[]
    }>
  },
  technologyStack: string[],
  estimatedTimeline: string,
  estimatedBudget: string,
  expectedROI: string,
  riskAssessment: string[],
  nextSteps: string[]
}
```

---

## 17. Chatbot Configuration System

### Admin Page: `/admin/chatbot-settings`

Database-driven configuration for the AI chatbot widget that appears on public pages.

### Configuration (`chatbot_config` table)
- Bot name, company name
- System prompt, greeting message, fallback message
- Personality, response style
- Enable/disable toggle
- Max response length

### Knowledge Base (`chatbot_knowledge_base` table)
- Category, question, answer
- Keywords (array), priority
- Active/inactive toggle

### Chatbot Widget
- `client/src/components/ChatWidget.tsx`
- Appears on public pages (hidden on admin/portal pages)
- Uses Gemini via Replit AI Integrations for responses
- Pulls knowledge base entries to augment system prompt
- Test mode available in admin settings

---

## 18. Stripe Billing Integration

### Current Status
Stripe integration is partially implemented. The webhook endpoint at `POST /api/stripe/webhook` is currently a placeholder (always returns 200). Core billing logic exists but the full payment flow is paused pending configuration.

### Setup
- Uses `stripe-replit-sync` package for Replit environment
- Client: `server/stripeClient.ts`
- Business logic: `server/stripeService.ts`
- Webhook handlers: `server/webhookHandlers.ts`

### Portal Billing Features
- View invoices (`GET /api/portal/invoices`)
- List products (`GET /api/portal/stripe/products`)
- Create checkout session (`POST /api/portal/stripe/create-checkout-session`)
- Access customer portal (`POST /api/portal/stripe/customer-portal`)

### Webhook
- `POST /api/stripe/webhook` - Receives Stripe events
- Uses `express.raw()` middleware (must be registered before `express.json()`)
- Handles: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, etc.

---

## 19. Google Workspace Integrations

### Services
- **Google Auth** (`server/services/google-auth.ts`): OAuth 2.0 flow for Google services
- **Google Drive** (`server/services/google-drive.ts`): Client folder structure creation
- **Google Sheets** (`server/services/google-sheets.ts`): Project dashboard spreadsheets
- **Google Calendar** (`server/services/google-calendar.ts`): Project calendars and events
- **Google Gmail** (`server/services/google-gmail.ts`): Email thread tracking

### Configuration
Requires `GOOGLE_OAUTH_SECRETS` env var containing JSON with OAuth client credentials.

---

## 20. API Reference

### Authentication
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Admin login |
| POST | `/api/auth/logout` | Public | Admin logout |
| GET | `/api/auth/me` | Session | Current admin user |
| POST | `/api/portal/login` | Public | Portal login |
| POST | `/api/portal/logout` | Public | Portal logout |
| GET | `/api/portal/me` | Portal | Current portal user |

### Public
| Method | Path | Description |
|---|---|---|
| POST | `/api/contact` | Submit contact/consultation form |
| GET | `/api/services` | List all services |
| GET | `/api/services/featured` | Featured services |
| GET | `/api/services/:slug` | Service by slug |
| GET | `/api/case-studies` | All case studies |
| GET | `/api/case-studies/featured` | Featured case studies |
| POST | `/api/automation-discovery` | Submit discovery questionnaire |

### Admin - Clients & Projects
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/clients` | List clients (paginated) |
| POST | `/api/admin/clients` | Create client |
| GET | `/api/admin/clients/:id` | Client detail |
| PUT | `/api/admin/clients/:id` | Update client |
| DELETE | `/api/admin/clients/:id` | Delete client |
| POST | `/api/admin/clients/convert-inquiry` | Convert inquiry to client |
| GET | `/api/admin/clients/:id/projects` | List client projects |
| POST | `/api/admin/clients/:id/projects` | Create project |
| PUT | `/api/admin/clients/:cid/projects/:pid` | Update project |
| DELETE | `/api/admin/clients/:cid/projects/:pid` | Delete project |

### Admin - Social Media
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/social/accounts` | List accounts (filterable by clientId) |
| POST | `/api/admin/social/accounts` | Create account manually |
| DELETE | `/api/admin/social/accounts/:id` | Delete account |
| GET | `/api/admin/social/campaigns` | List campaigns |
| POST | `/api/admin/social/campaigns` | Create campaign |
| PUT | `/api/admin/social/campaigns/:id` | Update campaign |
| DELETE | `/api/admin/social/campaigns/:id` | Delete campaign |
| GET | `/api/admin/social/posts` | List posts (filterable) |
| POST | `/api/admin/social/posts` | Create post |
| PUT | `/api/admin/social/posts/:id` | Update post |
| DELETE | `/api/admin/social/posts/:id` | Delete post |
| POST | `/api/admin/social/posts/:id/publish` | Publish post now |
| POST | `/api/admin/social/media/upload` | Upload media file |
| POST | `/api/admin/social/scrape` | Scrape URL for content/images |

### Admin - AI Generation
| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/social/ai/generate-post` | AI content generation |
| POST | `/api/admin/social/ai/research` | AI trend research |
| POST | `/api/admin/social/ai/design` | AI design suggestions |
| POST | `/api/admin/social/ai/review` | AI post review |
| POST | `/api/admin/social/ai/vibe-edit` | AI tone adjustment |
| POST | `/api/admin/social/ai/orchestrate` | Full AI workflow |
| POST | `/api/admin/social/ai/autonomous` | Fully autonomous creation |
| POST | `/api/admin/social/ai/generate-image` | AI image generation |
| POST | `/api/admin/social/ai/generate-video` | AI video generation |

### Admin - Meta OAuth
| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/social/meta/connect` | Generate Facebook OAuth URL |
| GET | `/api/admin/social/meta/callback` | OAuth callback handler |

### Portal - Social Media (mirrors admin)
| Method | Path | Description |
|---|---|---|
| GET | `/api/portal/social/accounts` | List client's accounts |
| POST | `/api/portal/social/accounts` | Create account |
| DELETE | `/api/portal/social/accounts/:id` | Delete account (verified ownership) |
| GET | `/api/portal/social/campaigns` | List client's campaigns |
| POST | `/api/portal/social/campaigns` | Create campaign |
| PUT | `/api/portal/social/campaigns/:id` | Update campaign |
| DELETE | `/api/portal/social/campaigns/:id` | Delete campaign |
| GET | `/api/portal/social/posts` | List client's posts |
| POST | `/api/portal/social/posts` | Create post |
| PUT | `/api/portal/social/posts/:id` | Update post |
| DELETE | `/api/portal/social/posts/:id` | Delete post |
| POST | `/api/portal/social/posts/:id/publish` | Publish post |
| POST | `/api/portal/social/media/upload` | Upload media |
| POST | `/api/portal/social/scrape` | Scrape URL |
| POST | `/api/portal/social/ai/generate-post` | AI generate |
| POST | `/api/portal/social/ai/research` | AI research |
| POST | `/api/portal/social/ai/orchestrate` | Full AI workflow |
| POST | `/api/portal/social/ai/autonomous` | Autonomous creation |
| POST | `/api/portal/social/ai/generate-image` | AI image |
| POST | `/api/portal/social/ai/generate-video` | AI video |
| POST | `/api/portal/social/meta/connect` | Portal OAuth connect |
| GET | `/api/portal/social/meta/callback` | Portal OAuth callback |

### Portal - Core
| Method | Path | Description |
|---|---|---|
| GET | `/api/portal/client-info/:slug` | Client name for login page |
| GET | `/api/portal/dashboard` | Dashboard stats |
| GET | `/api/portal/projects` | Client projects |
| GET | `/api/portal/usage` | AI usage data |
| GET | `/api/portal/invoices` | Stripe invoices |
| GET | `/api/portal/updates` | Software updates |
| GET | `/api/portal/tickets` | Support tickets |
| POST | `/api/portal/tickets` | Create ticket |
| GET | `/api/portal/tickets/:id` | Ticket detail |
| POST | `/api/portal/tickets/:id/messages` | Reply to ticket |

---

## 21. Data Formats & Output Shapes

### API Response Format
All API responses are JSON. Successful responses return the data directly (no wrapper). Errors return:
```json
{
  "message": "Error description",
  "error": "Optional detailed error"
}
```
HTTP status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error).

### AI Generate Post Request
```json
{
  "prompt": "Write about spring home maintenance tips",
  "platforms": ["facebook", "instagram"],
  "brandVoiceId": "optional-uuid",
  "campaignId": "optional-uuid"
}
```

### AI Research Request
```json
{
  "topic": "home renovation trends 2026",
  "platforms": ["facebook", "instagram", "twitter"]
}
```

### AI Orchestrate Request
```json
{
  "briefing": "Create a post about our new service offering (scrape https://example.com)",
  "platforms": ["facebook", "instagram"],
  "brandVoiceId": "optional-uuid",
  "campaignId": "optional-uuid"
}
```

### AI Autonomous Request
```json
{
  "briefing": "Research current roofing trends and create engaging content",
  "platforms": ["facebook", "instagram"],
  "brandVoiceId": "optional-uuid",
  "campaignId": "optional-uuid",
  "autoPost": false
}
```

### Create Post Request
```json
{
  "content": "Post text here",
  "platforms": ["facebook", "instagram"],
  "accountIds": ["uuid1", "uuid2"],
  "mediaUrls": ["/uploads/social-media/image.png"],
  "hashtags": ["#example"],
  "status": "draft",
  "scheduledAt": "2026-03-15T14:00:00Z",
  "campaignId": "optional-uuid"
}
```

### Publish Post Request
```json
{}
```
No body needed. Uses post's existing content, media, and account IDs.

### Upload Media Response
```json
{
  "url": "/uploads/social-media/1709312345-filename.jpg"
}
```

### Brand Voice Profile
```json
{
  "name": "Professional",
  "tone": "Authoritative but approachable",
  "style": "Clear, concise, data-driven",
  "vocabulary": ["innovative", "solutions", "expertise"],
  "avoidWords": ["cheap", "discount", "deal"],
  "examplePosts": ["Example post content here..."],
  "preferences": { "emoji_use": "minimal", "hashtag_count": 5 },
  "isDefault": true
}
```

---

## 22. Critical Implementation Notes

### Database Driver Selection
```
Use dbPg (node-postgres) for:
  - All social_* tables
  - All chat_* tables
  - chatbot_config, chatbot_knowledge_base
  - client_portal_users

Use db (neon-http) for:
  - All other tables (users, clients, projects, services, etc.)
```

### SelectItem Component
Never use `value=""` in Shadcn/Radix `<SelectItem>`. It causes a white screen crash. Use `value="none"` instead:
```tsx
// BAD - causes crash
<SelectItem value="">All</SelectItem>

// GOOD
<SelectItem value="none">All</SelectItem>
```

### metaPublisher.baseUrl
Must be set before any publish call. Without it, relative `/uploads/...` paths won't resolve for Facebook/Instagram API:
```typescript
// In route handlers:
const protocol = req.headers['x-forwarded-proto'] || 'https';
const host = req.headers['x-forwarded-host'] || req.headers.host;
metaPublisher.baseUrl = `${protocol}://${host}`;

// In scheduler:
const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
metaPublisher.baseUrl = `https://${replitDomain}`;
```

### Files You Should NOT Modify
- `vite.config.ts` - Preconfigured for frontend/backend on same port
- `drizzle.config.ts` - Database migration config
- `server/vite.ts` - Vite dev server integration
- `package.json` scripts - Ask before modifying

### ID Column Types
Never change primary key column types between `serial` and `varchar`. This generates destructive ALTER TABLE statements. Match existing patterns.

### TanStack Query v5
Only object-form queries are supported:
```typescript
// Correct
useQuery({ queryKey: ['/api/data'] })

// Wrong - will not work
useQuery(['/api/data'])
```

### Tailwind CSS Variables
Colors in `index.css` must use `H S% L%` format (space-separated, percentages on S and L):
```css
--primary: 220 70% 50%;
```

### Session Configuration
- Admin session: Passport.js with `req.isAuthenticated()`
- Portal session: Custom `req.session.portalUser` object
- Both use the same PostgreSQL-backed session store
- 24-hour cookie expiry

---

## 23. Build & Deployment

### NPM Scripts
```bash
npm run dev      # Development: tsx server/index.ts (port 5000)
npm run build    # Production build: vite build + esbuild server bundle
npm run start    # Production: node dist/index.js
npm run check    # TypeScript type checking
npm run db:push  # Push Drizzle schema to database
```

### Production Build
1. `vite build` compiles frontend to `dist/public/`
2. `esbuild` bundles server to `dist/index.js` (ESM format, external node_modules)
3. Production server serves static files from `dist/public/`

### Replit Deployment
- Deployment is handled through Replit's publishing system
- `REPLIT_DEPLOYMENT=1` is set in production
- Session cookies are set to `secure: true` in production
- Static files served via Express from `dist/public/`

### Required System Dependencies
- **ffmpeg**: Required for AI video generation (compositing scene images into MP4)
- **Node.js 20+**: Required for ESM module support

---

## 24. Testing

### Framework
- Jest + ts-jest for unit tests
- @testing-library/react for component tests
- Supertest for API endpoint tests
- Vitest also configured (both available)

### Test Files
- `server/routes.test.ts` - API route tests
- `client/src/pages/admin/__tests__/` - Admin page component tests

### Running Tests
```bash
npx jest                    # Run all Jest tests
npx vitest                  # Run all Vitest tests
npx jest --testPathPattern=server  # Server tests only
```

---

## Appendix: Quick Reference

### Common Development Tasks

**Add a new social media feature:**
1. Add schema changes to `shared/schema.ts`
2. Add storage methods to `server/storage.ts` (use `dbPg` for social tables)
3. Add API routes to `server/social-media-routes.ts`
4. Add UI to both `SocialMediaPage.tsx` (admin) and `PortalSocialMedia.tsx` (portal)
5. Run `npm run db:push`

**Add a new AI agent capability:**
1. Add function to `server/services/ai-agents.ts`
2. Add route handler in `server/social-media-routes.ts`
3. Add UI trigger in both admin and portal social media pages

**Add a new portal page:**
1. Create component in `client/src/pages/portal/`
2. Add route in `client/src/App.tsx` under the portal section
3. Add backend route in `server/client-portal-routes.ts`
4. Add nav link in `PortalLayout.tsx`

**Connect a new social platform:**
1. Add platform to the platforms array validation
2. Create publisher service similar to `meta-publisher.ts`
3. Add OAuth routes if needed
4. Update `publishPost` logic in routes and scheduler
