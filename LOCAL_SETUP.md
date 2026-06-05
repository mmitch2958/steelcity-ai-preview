# Steel City AI - Local Development Setup Guide

This document provides complete instructions for setting up and running the Steel City AI application locally using VS Code or any other development environment.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Directory Structure](#directory-structure)
4. [Prerequisites](#prerequisites)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Installation & Running](#installation--running)
8. [API Routes Overview](#api-routes-overview)
9. [Database Schema](#database-schema)
10. [Development Workflow](#development-workflow)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

Steel City AI is a full-stack marketing website for an AI integration service provider. The application features:

- **Marketing Pages**: Homepage, Services, Case Studies, Blog, About
- **Automation Discovery System**: Multi-step AI-powered questionnaire for capturing business automation requirements
- **Admin Portal**: Client management, project tracking, milestone management
- **Contact System**: Lead capture with inquiry tracking
- **Authentication**: Session-based authentication with Passport.js

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| Shadcn/ui + Radix UI | Component library |
| TanStack Query | Server state management |
| React Hook Form + Zod | Form handling & validation |
| Wouter | Client-side routing |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web framework |
| TypeScript | Type safety |
| Passport.js | Authentication |
| express-session | Session management |

### Database
| Technology | Purpose |
|------------|---------|
| PostgreSQL | Database |
| Drizzle ORM | Type-safe database operations |
| drizzle-zod | Schema validation |

### External Services
| Service | Purpose |
|---------|---------|
| OpenAI API | AI outline generation (GPT-4o) |
| Google Gemini | AI outline generation (alternative) |
| Gmail API | Email notifications |
| Cloudflare Turnstile | Bot protection |

---

## Directory Structure

```
steelcity-ai/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── App.tsx             # Main app with routing
│   │   ├── main.tsx            # Entry point
│   │   ├── index.css           # Global styles & Tailwind config
│   │   ├── pages/              # Route pages
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── AutomationDiscovery.tsx
│   │   │   ├── Blog.tsx
│   │   │   ├── Careers.tsx
│   │   │   ├── Privacy.tsx / Terms.tsx / Cookies.tsx
│   │   │   ├── Support.tsx
│   │   │   ├── services/       # Service detail pages
│   │   │   └── admin/          # Admin portal pages
│   │   │       ├── Dashboard.tsx
│   │   │       ├── ClientsPage.tsx
│   │   │       ├── ClientDetail.tsx
│   │   │       ├── ProjectDashboard.tsx
│   │   │       ├── ConsultationsPage.tsx
│   │   │       ├── ChatManagementPage.tsx
│   │   │       └── AutomationDiscoveryAdmin.tsx
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/             # Shadcn/ui base components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── Services.tsx
│   │   │   ├── CaseStudies.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── ChatWidget.tsx
│   │   │   ├── ConsultationForm.tsx
│   │   │   └── TurnstileWidget.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── use-bot-protection.ts
│   │   └── lib/                # Utilities
│   │       ├── queryClient.ts  # TanStack Query setup
│   │       └── utils.ts
│   ├── public/                 # Static assets
│   │   └── Coldwell.html       # Static demo page
│   └── index.html              # HTML template
│
├── server/                      # Backend Express application
│   ├── index.ts                # Server entry point
│   ├── routes.ts               # All API route handlers
│   ├── storage.ts              # Database operations (IStorage interface)
│   ├── vite.ts                 # Vite dev server integration
│   ├── gmail.ts                # Gmail API integration
│   ├── turnstile.ts            # Cloudflare Turnstile verification
│   └── services/               # Business logic services
│
├── shared/                      # Shared code between frontend & backend
│   └── schema.ts               # Drizzle database schema & Zod types
│
├── migrations/                  # Drizzle database migrations
│
├── uploads/                     # File uploads directory
│
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
├── drizzle.config.ts           # Drizzle ORM configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── components.json             # Shadcn/ui configuration
```

---

## Prerequisites

Before setting up locally, ensure you have:

1. **Node.js** (v20 or higher)
   ```bash
   node --version  # Should be v20.x.x or higher
   ```

2. **npm** or **pnpm** package manager
   ```bash
   npm --version
   ```

3. **PostgreSQL** (v14 or higher)
   - Install locally or use Docker
   - Create a new database for the project

4. **VS Code** (recommended)
   - Extensions: ESLint, Prettier, Tailwind CSS IntelliSense, TypeScript

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

### Required Variables

```env
# Database Connection (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/steelcity_ai
PGHOST=localhost
PGPORT=5432
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGDATABASE=steelcity_ai

# Session Security (Generate a random 32+ character string)
SESSION_SECRET=your-super-secret-session-key-at-least-32-chars

# Server Port
PORT=5000
```

### Required for Forms (Contact & Automation Discovery)

```env
# Cloudflare Turnstile (bot protection - REQUIRED for form submissions)
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
```

**Note**: Without Turnstile keys, the `/api/contact` and `/api/automation-discovery` endpoints will reject submissions.

### Optional Variables (for full functionality)

```env
# OpenAI API (for AI outline generation)
AI_INTEGRATIONS_OPENAI_API_KEY=sk-your-openai-api-key
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1

# Google Gemini (alternative AI provider - used alongside OpenAI)
GEMINI_API_KEY=your-gemini-api-key

# Gmail API (for email notifications)
GOOGLE_OAUTH_SECRETS={"client_id":"...","client_secret":"...","refresh_token":"..."}

# Google Analytics (optional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Generating SESSION_SECRET

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using openssl
openssl rand -hex 32
```

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE steelcity_ai;

# Create user (optional)
CREATE USER steelcity_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE steelcity_ai TO steelcity_user;

# Exit
\q
```

### 2. Run Drizzle Migrations

```bash
# Push schema to database
npm run db:push
```

This will create all necessary tables based on `shared/schema.ts`.

### 3. Verify Tables Created

The following tables should be created:

**Core Tables:**

| Table | Description |
|-------|-------------|
| `users` | Admin user accounts |
| `services` | Service offerings |
| `case_studies` | Client success stories |
| `contact_inquiries` | Contact form submissions |
| `automation_discovery_requests` | AI discovery form submissions |
| `clients` | Client records |
| `projects` | Client projects |
| `project_notes` | Project notes |
| `project_documents` | Uploaded documents |
| `project_milestones` | Project milestones |
| `project_deliverables` | Milestone deliverables |
| `project_status_updates` | Project status updates |
| `project_dashboards` | Project dashboard configs |
| `chat_sessions` | Chat sessions |
| `chat_messages` | Chat messages |
| `chat_participants` | Chat participants |
| `session` | User sessions (auto-created by express-session) |

**Google Integration Tables (optional):**

| Table | Description |
|-------|-------------|
| `google_integrations` | OAuth tokens for Google services |
| `google_sheets` | Connected Google Sheets |
| `google_drive_folders` | Connected Drive folders |
| `google_calendar` | Calendar integrations |
| `google_calendar_events` | Synced calendar events |
| `gmail_threads` | Gmail thread tracking |
| `sync_logs` | Integration sync logs |

> **Important:** These schema examples are simplified for reference. The authoritative source is `shared/schema.ts`, which includes validation rules, default values, and strict type definitions. Always refer to the source file when writing database operations or API handlers.

### 4. Create Admin User

The first admin user needs to be created manually. Follow these steps:

**Step 1: Generate bcrypt password hash**

```bash
# Using Node.js (run in project directory after npm install)
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password-here', 10).then(h => console.log(h))"
```

**Step 2: Insert user into database**

```sql
-- Replace the hash below with the output from Step 1
INSERT INTO users (username, password, role)
VALUES (
  'admin',
  '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'admin'
);
```

**Note**: The `id` and `created_at` fields are auto-generated by the database defaults. PostgreSQL's `gen_random_uuid()` function requires the `pgcrypto` extension, which is typically enabled by default in modern PostgreSQL installations.

---

## Installation & Running

### 1. Clone Repository

```bash
git clone https://github.com/SteelCity-ai/steelcity-ai.com.git
cd steelcity-ai.com
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy example env file or create new
cp .env.example .env  # if exists
# Or create .env manually with variables from above
```

### 4. Setup Database

```bash
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:5000**

### Available npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push schema changes to database |

---

## API Routes Overview

> **Important:** This is a simplified summary. The authoritative source for all routes, including authentication requirements and request/response schemas, is `server/routes.ts`. Routes may have additional middleware (Turnstile, validation) not shown here.

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| GET | `/api/auth/me` | Get current user | Yes |

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description | Notes |
|--------|----------|-------------|-------|
| GET | `/api/services` | List all services | |
| GET | `/api/services/featured` | Featured services | |
| GET | `/api/services/:slug` | Single service by slug | |
| GET | `/api/case-studies` | List case studies | |
| GET | `/api/case-studies/featured` | Featured case studies | |
| POST | `/api/case-studies` | Create case study | No auth middleware* |
| POST | `/api/contact` | Submit contact form | Requires Turnstile |
| POST | `/api/automation-discovery` | Submit discovery form | Requires Turnstile |

*Note: POST `/api/case-studies` lacks auth middleware in current implementation but is intended for admin use.

### Admin Endpoints (Auth Required via `requireAuth` middleware)

#### Services CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/services` | Create service |
| PUT | `/api/services/:id` | Update service |
| DELETE | `/api/services/:id` | Delete service |

### Admin - Inquiries & Consultations (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contact/inquiries` | List contact inquiries |
| PATCH | `/api/contact/inquiries/:id/status` | Update inquiry status |
| GET | `/api/admin/consultations` | List consultations |
| GET | `/api/admin/consultations/:id` | Get consultation details |
| GET | `/api/admin/consultations/status/:status` | Filter by status |

### Admin - Clients (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/clients` | List all clients |
| POST | `/api/admin/clients` | Create client |
| GET | `/api/admin/clients/:id` | Get client details |
| PUT | `/api/admin/clients/:id` | Update client |
| DELETE | `/api/admin/clients/:id` | Delete client |
| POST | `/api/admin/clients/convert-inquiry` | Convert inquiry to client |

### Admin - Projects (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/clients/:id/projects` | List client projects |
| POST | `/api/admin/clients/:id/projects` | Create project |
| GET | `/api/admin/clients/:clientId/projects/:projectId` | Get project |
| PUT | `/api/admin/clients/:clientId/projects/:projectId` | Update project |
| DELETE | `/api/admin/clients/:clientId/projects/:projectId` | Delete project |
| GET | `.../projects/:projectId/dashboard` | Project dashboard |

### Admin - Project Sub-resources (Auth Required)

All under `/api/admin/clients/:clientId/projects/:projectId/`:

| Resource | Methods | Description |
|----------|---------|-------------|
| `/notes` | GET, POST | Project notes |
| `/notes/:noteId` | DELETE | Delete note |
| `/documents` | GET | List documents |
| `/documents/upload` | POST | Upload document |
| `/documents/:docId/download` | GET | Download document |
| `/documents/:docId` | DELETE | Delete document |
| `/milestones` | GET, POST | Project milestones |
| `/milestones/:milestoneId` | PUT, DELETE | Manage milestone |
| `/milestones/:milestoneId/deliverables` | GET, POST | Milestone deliverables |
| `/deliverables` | GET | All project deliverables |
| `/deliverables/:deliverableId` | PUT, DELETE | Manage deliverable |
| `/status-updates` | GET, POST | Status updates |
| `/status-updates/:statusUpdateId` | PUT | Edit status update |
| `/status-updates/:statusUpdateId/mark-sent` | PATCH | Mark as sent |

---

## Database Schema

### Core Tables

#### users
```typescript
{
  id: uuid (primary key)
  username: string (unique)
  password: string (bcrypt hash)
  role: 'admin' | 'user'
  createdAt: timestamp
}
```

#### services
```typescript
{
  id: uuid (primary key)
  title: string
  slug: string (unique)
  description: string
  longDescription: string (optional)
  features: string[]
  benefits: string[] (optional)
  pricing: jsonb { startingPrice, pricingModel, packages[] }
  deliveryTime: string (optional)
  iconUrl: string (optional)
  imageUrl: string (optional)
  category: string
  tags: string[] (optional)
  featured: boolean
  active: boolean
  order: integer
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### case_studies
```typescript
{
  id: uuid (primary key)
  title: string
  company: string
  industry: string
  challenge: string
  solution: string
  duration: string
  tags: string[]
  results: jsonb[] { label, value }
  featured: boolean
  createdAt: timestamp
}
```

#### contact_inquiries
```typescript
{
  id: uuid (primary key)
  name: string
  email: string
  company: string (optional)
  service: string (optional)
  message: string
  clientId: uuid (optional - link to clients)
  consultationData: jsonb (detailed consultation info)
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'
  createdAt: timestamp
}
```

#### clients
```typescript
{
  id: uuid (primary key)
  name: string
  email: string
  company: string (optional)
  phone: string (optional)
  notes: string (optional)
  status: 'active' | 'inactive' | 'archived'
  createdAt: timestamp
}
```

#### projects
```typescript
{
  id: uuid (primary key)
  clientId: uuid (foreign key)
  title: string
  description: string (optional)
  status: 'prospect' | 'discovery' | 'in_progress' | 'qa' | 'delivered' | 'on_hold'
  progress: integer (0-100 percentage)
  budget: string (optional)
  startDate: timestamp (optional)
  endDate: timestamp (optional)
  createdAt: timestamp
}
```

#### automation_discovery_requests
```typescript
{
  id: uuid
  contactInfo: jsonb
  processDetails: jsonb
  painPoints: jsonb
  technicalRequirements: jsonb
  projectPreferences: jsonb
  openaiOutline: text
  geminiOutline: text
  mergedOutline: text
  status: 'pending' | 'reviewed' | 'converted'
  createdAt: timestamp
}
```

---

## Development Workflow

### Adding New Components

1. Use Shadcn/ui CLI for base components:
   ```bash
   npx shadcn-ui@latest add button
   ```

2. Components go in `client/src/components/ui/`

### Adding New Pages

1. Create page component in `client/src/pages/`
2. Add route in `client/src/App.tsx`

### Adding API Endpoints

1. Add route handler in `server/routes.ts`
2. Add storage method in `server/storage.ts`
3. Add types/schema in `shared/schema.ts`

### Database Changes

1. Modify schema in `shared/schema.ts`
2. Run `npm run db:push` to apply changes

---

## Troubleshooting

### Common Issues

**Error: SESSION_SECRET environment variable is required**
- Ensure `.env` file exists with `SESSION_SECRET` set

**Error: DATABASE_URL not found**
- Verify PostgreSQL is running and `.env` has correct connection string

**tsx: not found**
- Run `npm install` to ensure all dependencies are installed

**Port 5000 already in use**
- Change `PORT` in `.env` or kill the process using port 5000

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h localhost -U your_user -d steelcity_ai

# Check if PostgreSQL is running
pg_isready -h localhost -p 5432
```

### Resetting Database

```bash
# Drop and recreate (WARNING: destroys all data)
psql -U postgres -c "DROP DATABASE steelcity_ai;"
psql -U postgres -c "CREATE DATABASE steelcity_ai;"
npm run db:push
```

---

## VS Code Recommended Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Recommended Extensions

- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features
- GitLens
- PostgreSQL (by Chris Kolkman)

---

## Contact & Support

For questions about this codebase, refer to:
- `replit.md` - Additional project documentation
- `design_guidelines.md` - UI/UX design specifications
- `ADMIN_SETUP.md` - Admin portal setup guide
