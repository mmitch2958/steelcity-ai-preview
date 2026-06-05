# Overview
This project is an AI integration service provider website for "Steel City AI," designed to showcase AI automation services across various domains like document processing, customer service, and marketing optimization. Its primary purpose is to generate leads through a professional marketing site featuring case studies, service offerings, and a contact system. A core innovation is the "Automation Discovery System," an AI-powered questionnaire that tailors implementation outlines for prospective clients. The platform also incorporates a client portal for project management, billing, and support, alongside an admin portal for content management, client requests, and a customizable AI chatbot. The business vision is to position Steel City AI as a leader in applied AI solutions, leveraging advanced AI models to deliver tangible business value and drive market growth.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture
## Frontend
The frontend is built with React 18 and TypeScript, utilizing Wouter for routing. UI components are developed with Shadcn/ui on top of Radix UI primitives, styled using Tailwind CSS with a custom design system. State management employs TanStack Query for server-side data and React Context for client-side state, with form handling managed by React Hook Form and Zod validation. The design system features a professional color palette of navy, bright blue, and neutral grays, Inter font family, mobile-first responsive design, and a dark mode theme provider.

## Backend
The backend runs on Node.js with Express.js, written in TypeScript. It provides a RESTful API with JSON responses and incorporates centralized error handling middleware.

## Database & Data Layer
PostgreSQL is used as the database, configured for Neon serverless in production and local PG via TCP for development. Drizzle ORM handles database interactions and schema migrations. A repository pattern is applied for the storage interface. Note: `dbPg` (node-postgres pool) is exclusively used for service queries, social media, and chat tables due to compatibility issues with Neon HTTP driver for parameterized WHERE queries in development.

## Security & Bot Protection
Cloudflare Turnstile is implemented for CAPTCHA, complemented by honeypot and timing protection as fallbacks.

## Service Pages
Each service page (Document Processing, Custom Agent Automation, Marketing Automation, Data Analysis, Custom Solutions) is a standalone component with a unique visual identity and dedicated accent colors, illustrations, and layout patterns. They are designed to avoid shared templates to allow for distinct branding and design approaches per service.

## Business Logic
- **Contact Management**: Features lead capture and inquiry tracking.
- **Case Studies & Service Catalog**: Content management system for case studies (featuring real company names and data) and database-driven service offerings.
- **Automation Discovery System**: An AI-powered multi-step questionnaire leveraging Google Gemini (3.1 Pro primary, 2.5 Pro secondary) to generate personalized implementation outlines. It includes real-time generation, email notifications, and an admin portal for AI comparison analysis and a "Merge Best of Both" feature.
- **Client Portal System**: Provides authenticated client access for project viewing, AI usage tracking, Stripe-integrated billing, and support ticket management.
- **Admin Support Ticket Management**: An administrative interface for managing client support tickets.
- **Chatbot Configuration System**: A database-driven system allowing admins to customize AI chatbot settings, system prompts, and knowledge bases via a web interface, including a test mode.
- **Social Media Management Platform**: An AI-powered platform with specialized agents for research, design, post creation, and training. It supports multi-platform posting (Facebook, Instagram, X/Twitter, LinkedIn, YouTube), campaign management, brand voice profiles, AI content generation, trend research, AI image generation (Gemini 2.5 Flash Image with OpenAI gpt-image-1 fallback), post review/scoring, natural language "vibe edits," and media attachments. It features a "Create Everything" autonomous mode for fully automated content creation, scheduling, and publishing. The client portal offers full feature parity with the admin interface for social media management, with data isolated per client and robust OAuth integrations for Facebook/Instagram. Includes content calendar, analytics dashboard, and multi-day scheduling.

# External Dependencies
- **Database**: Neon serverless PostgreSQL.
- **Cloudflare**: Turnstile for bot protection.
- **Stripe**: For payment processing and client billing.
- **Google Gemini**: 2.5 Pro (Automation Discovery primary, chatbot, social media AI), 2.5 Flash Image (image generation), and Veo 3.0 (`veo-3.0-generate-preview`) for AI video generation with native audio.
- **OpenAI**: gpt-image-1 (fallback for image generation).
- **Video Generation Strategy**: `generateVideo()` in `ai-agents.ts` tries Veo 3.0 with `generateAudio: true` first (uses `gemini.models.generateVideos()` with long-running operation polling), then falls back to the ffmpeg slideshow approach if Veo is unavailable.
- **inference.sh**: Platform providing access to 150+ AI models via CLI. Used for Veo 3.1 Fast video generation with native audio (`google/veo-3-1-fast`). The `infsh` CLI binary is installed at `~/.local/bin/infsh` and uses `INFERENCE_API_KEY` env var (mapped to `INFSH_API_KEY`). Video generation has a 3-tier fallback: inference.sh Veo 3.1 (video+audio) → Google API Veo 2 (video only) → ffmpeg slideshow (images).
- **Google Fonts**: For typography (Inter, DM Sans, Fira Code, Geist Mono).
- **Lucide React**: For iconography.
- **Vite**: Build tool.