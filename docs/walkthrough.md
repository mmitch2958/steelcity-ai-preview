# Social Media Enhancements — Walkthrough

## Overview

Four new features were added to the social media marketing system:

1. **Brand Voice Selector** — AI content generation now respects brand voice profiles
2. **Content Calendar** — Visual month-based calendar view of posts in admin
3. **Analytics Dashboard** — Engagement metrics, platform breakdowns, and top posts
4. **YouTube Integration** — YouTube as a platform + video import via oEmbed

---

## Files Changed

### Backend

#### [ai-agents.ts](file:///c:/Users/mike/Documents/Git/SteelCityAI/steelcity-ai.com/server/services/ai-agents.ts)
- `generatePost()`, `orchestrateContentCreation()`, `fullyAutonomousCreate()` now accept optional `brandVoice` parameter
- Brand voice context (tone, style, vocabulary, avoid-words, examples) injected into AI prompts

#### [social-media-routes.ts](file:///c:/Users/mike/Documents/Git/SteelCityAI/steelcity-ai.com/server/social-media-routes.ts)
- Added `brandVoiceId` to schemas for `/orchestrate`, `/generate-post`, `/autonomous`
- Routes fetch brand voice profile from storage and pass to AI agent
- New endpoint: `POST /api/admin/social/media/from-youtube` — extracts video metadata via oEmbed API and downloads thumbnail

### Frontend

#### [SocialMediaPage.tsx](file:///c:/Users/mike/Documents/Git/SteelCityAI/steelcity-ai.com/client/src/pages/admin/SocialMediaPage.tsx) (Admin)
- **Brand Voice**: Dropdown in Briefing card, state + query, `brandVoiceId` passed to all 3 AI mutations
- **YouTube**: Added to PLATFORMS, YouTube URL import UI in Media Attachments, `handleImportYoutube` function
- **ContentCalendarTab**: Month navigation, day grid with post dots, day-detail card
- **AnalyticsTab**: 4 metric cards (likes/shares/comments/reach), platform breakdown, best posts, post overview
- **Tabs**: Added Calendar and Analytics tab triggers + content

#### [PortalSocialMedia.tsx](file:///c:/Users/mike/Documents/Git/SteelCityAI/steelcity-ai.com/client/src/pages/portal/PortalSocialMedia.tsx) (Portal)
- Added YouTube to PLATFORMS array with `SiYoutube` icon

---

## Lint Notes

The IDE reports many `JSX.IntrinsicElements` and `Cannot find module` errors — these are **pre-existing** environment issues (missing `@types/react` resolution in the IDE context), not caused by our changes. They do not affect the actual build via Vite/esbuild.
