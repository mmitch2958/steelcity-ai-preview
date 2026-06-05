# Social Media Management Platform

> **AI-powered social media management platform for multi-account publishing, scheduling, analytics, and approval workflows.**

Built by **Steel City AI** — Transforming small businesses through intelligent automation.

---

## 🚀 Features

### Core Capabilities
- **Multi-Account Management**: Connect and manage Facebook, Twitter, LinkedIn, and Instagram accounts from a single dashboard
- **Unified Post Composer**: Create, edit, and preview posts with real-time platform-specific rendering
- **Advanced Scheduling**: Calendar view with drag-and-drop rescheduling, bulk operations, and recurring posts
- **Approval Workflows**: Multi-level approval chains with email notifications and audit trails
- **Analytics Dashboard**: Performance metrics, hashtag analytics, engagement tracking, and trend analysis
- **AI-Powered Features**:
  - Performance prediction for post engagement
  - Smart hashtag suggestions
  - Brand voice customization
  - Content optimization recommendations

### User Experience
- **Drag-and-Drop Media**: Upload and reorder images/videos with visual feedback
- **Real-Time Preview**: See exactly how your post will appear on each platform before publishing
- **Bulk Actions**: Schedule, delete, approve, or publish multiple posts at once
- **Post Templates**: Save and reuse common post formats
- **Auto-Save Drafts**: Never lose your work with automatic draft saving
- **Loading Skeletons**: Content-aware loading states for better perceived performance

### Performance & Accessibility
- **Optimized Bundle**: <500KB initial load with lazy loading and code splitting
- **WCAG 2.1 AA Compliant**: Full keyboard navigation, screen reader support, and accessible design
- **Lighthouse Score 90+**: Performance, Accessibility, Best Practices, SEO
- **Cross-Browser Support**: Tested on Chrome, Firefox, and Safari
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [Usage](#usage)
  - [Running Locally](#running-locally)
  - [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [Feature Guide](#feature-guide)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🏁 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js**: v18.x or higher ([Download](https://nodejs.org/))
- **npm**: v9.x or higher (comes with Node.js)
- **PostgreSQL**: v14.x or higher ([Download](https://www.postgresql.org/download/))
- **Git**: For version control ([Download](https://git-scm.com/))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/steelcity-ai/steelcity-ai.com.git
   cd steelcity-ai.com
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up the database**:
   ```bash
   # Create a PostgreSQL database
   createdb social_media_platform
   
   # Run migrations
   npm run db:push
   ```

### Environment Setup

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/social_media_platform"

# Session
SESSION_SECRET="your-secure-random-session-secret"

# Social Media API Keys
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"
TWITTER_API_KEY="your-twitter-api-key"
TWITTER_API_SECRET="your-twitter-api-secret"
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"
INSTAGRAM_CLIENT_ID="your-instagram-client-id"
INSTAGRAM_CLIENT_SECRET="your-instagram-client-secret"

# AI Services
OPENAI_API_KEY="your-openai-api-key"
GOOGLE_GENAI_API_KEY="your-google-genai-api-key"

# Email (Gmail API)
GMAIL_CLIENT_ID="your-gmail-client-id"
GMAIL_CLIENT_SECRET="your-gmail-client-secret"
GMAIL_REDIRECT_URI="http://localhost:5000/auth/gmail/callback"

# Google Workspace
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/auth/google/callback"

# Stripe (optional for billing)
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"

# Application
NODE_ENV="development"
PORT=5000
```

**⚠️ Security Note**: Never commit `.env` files. Add `.env` to your `.gitignore`.

---

## 🎯 Usage

### Running Locally

Start the development server:
```bash
npm run dev
```

The application will be available at: **http://localhost:5000**

**Default Admin Credentials** (change in production):
- **Email**: `admin@steelcity-ai.com`
- **Password**: `admin123`

### Building for Production

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

3. **Verify the build**:
   - Check that `dist/` directory contains bundled assets
   - Run Lighthouse audit to verify performance metrics
   - Test critical user flows

---

## 📁 Project Structure

```
steelcity-ai.com/
├── client/                  # Frontend React application
│   └── src/
│       ├── components/      # Reusable UI components
│       │   ├── ui/          # shadcn/ui components
│       │   └── social/      # Social media feature components
│       ├── pages/           # Route-level pages
│       ├── hooks/           # Custom React hooks
│       ├── lib/             # Utility functions
│       └── main.tsx         # Application entry point
├── server/                  # Backend Express application
│   ├── routes/              # API route handlers
│   ├── db.ts                # Database connection
│   ├── storage.ts           # Data access layer
│   └── index.ts             # Server entry point
├── shared/                  # Shared types and schemas
│   └── schema.ts            # Drizzle ORM schema
├── migrations/              # Database migrations
├── docs/                    # Project documentation
│   ├── PHASE1-DECOMPOSITION.md
│   ├── PHASE2-DECOMPOSITION.md
│   ├── PHASE3-DECOMPOSITION.md
│   ├── PHASE4-REFINED-DECOMPOSITION.md
│   └── CLIENT-LAUNCH-GUIDE.md
├── .env                     # Environment variables (not committed)
├── package.json             # Project dependencies
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── CHANGELOG.md             # Version history
└── README.md                # This file
```

---

## 🎨 Feature Guide

### Dashboard
- **Overview Metrics**: Quick stats on total posts, scheduled posts, engagement rate
- **Recent Activity**: Latest posts, approvals, and analytics
- **Quick Actions**: One-click access to create post, view calendar, check analytics

### Creating Posts
1. Navigate to **Create Post** tab
2. Select target accounts (multi-select supported)
3. Compose your content:
   - Text with character count per platform
   - Upload media (drag-and-drop or file picker)
   - Add hashtags (with AI suggestions)
4. Preview your post for each platform
5. Choose scheduling option:
   - **Publish Now**: Immediate posting
   - **Schedule**: Pick date and time
   - **Draft**: Save for later
   - **Submit for Approval**: Send to approval workflow

### Scheduling & Calendar
- **Month View**: See all scheduled posts at a glance
- **Drag-to-Reschedule**: Drag posts to new dates or times
- **Bulk Operations**: Select multiple posts to schedule, delete, or approve
- **Filters**: Filter by account, status, or date range

### Approval Workflow
1. **Creator**: Creates post and submits for approval
2. **Reviewer**: Reviews content and approves/rejects
3. **Approver**: Final approval before publishing
4. **Email Notifications**: Automatic emails at each step
5. **Audit Trail**: Complete history of approvals and changes

### Analytics
- **Performance Dashboard**: Engagement, reach, impressions, clicks
- **Hashtag Analytics**: Track which hashtags perform best
- **Trend Charts**: Visualize performance over time
- **Export**: Download analytics data as CSV

### AI Features
- **Performance Prediction**: ML model predicts engagement before posting
- **Hashtag Suggestions**: Context-aware hashtag recommendations
- **Brand Voice**: AI-powered content generation matching your brand tone
- **Optimization Tips**: Real-time suggestions to improve post performance

---

## 🛠️ Development

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, Vite
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4, Google Gemini
- **Authentication**: Passport.js with session-based auth
- **File Storage**: Google Cloud Storage
- **Email**: Gmail API
- **Payments**: Stripe

### Key Dependencies
- **UI Components**: Radix UI, Lucide Icons, Framer Motion
- **State Management**: React Query, React Hook Form
- **Drag-and-Drop**: @dnd-kit
- **Charts**: Recharts
- **Date Handling**: date-fns

### Development Workflow
1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test locally**:
   ```bash
   npm run dev
   ```

3. **Run type checking**:
   ```bash
   npm run check
   ```

4. **Commit using conventional commits**:
   ```bash
   git commit -m "feat(social): add drag-drop media upload"
   ```

5. **Push and create pull request**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Conventional Commits
Use these prefixes for all commits:
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `style:` — Code formatting
- `refactor:` — Code restructure
- `perf:` — Performance improvement
- `test:` — Adding tests
- `chore:` — Build/tooling

**Example**: `feat(approval): add email notifications for approval requests`

---

## 🧪 Testing

### Unit Tests
Run unit tests with Vitest:
```bash
npm run test
```

### End-to-End Tests
Run E2E tests with Playwright:
```bash
npm run test:e2e
```

### Test Coverage
- **Create Post Flow**: ✅ Tested
- **Scheduling Flow**: ✅ Tested
- **Approval Workflow**: ✅ Tested
- **Bulk Actions**: ✅ Tested
- **Analytics Dashboard**: ✅ Tested

### Accessibility Testing
- **Keyboard Navigation**: All interactive elements navigable via keyboard
- **Screen Reader**: Tested with NVDA (Windows) and VoiceOver (Mac)
- **Color Contrast**: All text meets WCAG 2.1 AA standards
- **Focus Indicators**: Visible focus states on all focusable elements

---

## 🚀 Deployment

### Production Checklist
- [ ] Update environment variables for production
- [ ] Run `npm run build` and verify no errors
- [ ] Run Lighthouse audit (target: 90+ on all metrics)
- [ ] Test critical user flows in staging
- [ ] Set up database backups
- [ ] Configure monitoring (error tracking, uptime)
- [ ] Set up SSL certificate
- [ ] Configure DNS records
- [ ] Review security headers
- [ ] Test rollback procedure

### Deployment Steps (Example: Replit)
1. Push code to GitHub repository
2. Connect Replit to GitHub repo
3. Set environment variables in Replit Secrets
4. Run build command: `npm run build`
5. Start production server: `npm start`
6. Verify deployment at public URL

### Environment Variables (Production)
Ensure all `.env` variables are set in your hosting platform's secrets/environment variables section. **Never expose API keys in client-side code.**

---

## 📚 Additional Resources

- **Client Launch Guide**: See [`docs/CLIENT-LAUNCH-GUIDE.md`](docs/CLIENT-LAUNCH-GUIDE.md)
- **Developer Guide**: See [`DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md)
- **Phase Decomposition Docs**: See [`docs/PHASE*-DECOMPOSITION.md`](docs/)
- **API Documentation**: (Coming soon)

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow code style**: Run `npm run check` before committing
4. **Write tests**: Ensure new features are tested
5. **Use conventional commits**: See [Conventional Commits](#conventional-commits)
6. **Submit a pull request**: Include description of changes

---

## 📄 License

**MIT License**

Copyright (c) 2026 Steel City AI

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

---

## 🆘 Support

**Steel City AI**  
📧 Email: support@steelcity-ai.com  
🌐 Website: [steelcity-ai.com](https://steelcity-ai.com)  
📍 Location: Pittsburgh, PA (North Hills)

For technical support, please open an issue on GitHub or contact our support team.

---

**Built with ❤️ by Steel City AI — Empowering SMBs through AI automation.**

