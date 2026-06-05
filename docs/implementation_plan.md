# Four Social Media Improvements: Brand Voice, Calendar, Analytics, YouTube

Implementing four improvements to the admin social media page: wiring brand voice profiles into AI Compose, adding a content calendar, adding an analytics dashboard, and adding YouTube as a platform with video import — all within the existing codebase patterns.

## Proposed Changes

### Feature 1: Brand Voice Selector in AI Compose

**Summary**: The brand voice profiles already exist in the DB and have CRUD endpoints, but only `applyVibeEdit()` currently uses them. We'll wire them into the AI Compose tab so users can select a brand voice before generating content, and pass that context through to all AI generation methods.

---

#### [MODIFY] [SocialMediaPage.tsx](file:///c:/Users/mike/Documents/Git/SteelCityAI/steelcity-ai.com/client/src/pages/admin/SocialMediaPage.tsx)

**In `AIComposeTab` (line ~810):**
- Add `selectedBrandVoiceId` state
- Add `useQuery` for `/api/admin/social/brand-voice` to fetch brand voice profiles
- Add a `Select` dropdown in the Briefing card (after the platform checkboxes, ~line 1120) to choose a brand voice profile
- Pass `brandVoiceId` in `orchestrateMutation`, `generatePostMutation`, and `autonomousMutation` payloads

---

#### [MODIFY] [social-media-routes.ts](file:///c:/Users/mike/Documents/Git/SteelCityAI/steelcity-ai.com/server/social-media-routes.ts)

- Add `brandVoiceId: z.string().optional()` to the Zod schemas for:
  - `/api/admin/social/ai/orchestrate` (line ~346)
  - `/api/admin/social/ai/generate-post` (line ~255)
  - `/api/admin/social/ai/autonomous` (line ~365)
- Fetch the brand voice profile from storage when `brandVoiceId` is provided
- Pass brand voice data to the `AIAgentService` methods

---

#### [MODIFY] [ai-agents.ts](file:///c:/Users/mike/Documents/Git/SteelCityAI/steelcity-ai.com/server/services/ai-agents.ts)

- Add optional `brandVoice?: BrandVoiceProfile` parameter to:
  - `generatePost()` (line 91)
  - `orchestrateContentCreation()` (line 595)
  - `fullyAutonomousCreate()` (line 464)
- When provided, inject the brand voice context (tone, style, vocabulary, avoid words, examples) into the AI prompt — same pattern already used in `applyVibeEdit()` (lines 236-252)

---

### Feature 2: Content Calendar Tab in Admin

**Summary**: The client portal already has a `ContentCalendarTab`. We'll create an admin version using the same calendar logic but pulling from admin API endpoints and adding more functionality.

---

#### [MODIFY] [SocialMediaPage.tsx](file:///c:/Users/mike/Documents/Git/SteelCityAI/steelcity-ai.com/client/src/pages/admin/SocialMediaPage.tsx)

- Add `useMemo` to the React import (line 1)
- Add `CalendarDays`, `ChevronLeft`, `ChevronRight` to lucide imports (line 21-27)
- Create new `ContentCalendarTab` component (~150 lines, modeled on [PortalSocialMedia.tsx ContentCalendarTab](file:///c:/Users/mike/Documents/Git/SteelCityAI/steelcity-ai.com/client/src/pages/portal/PortalSocialMedia.tsx#L942-L1116)):
  - Month navigation with prev/next buttons
  - 7-column calendar grid with day cells
  - Post indicators with color-coded status dots
  - Click-to-view day dialog showing all posts for that day  
  - Uses admin endpoint `/api/admin/social/posts` instead of portal endpoint
- Add new tab trigger and content in the main `SocialMediaPage` component (after Campaigns, ~line 2773)

---

### Feature 3: Analytics Dashboard Tab in Admin

**Summary**: Posts already have an `engagement` JSONB column. We'll create an analytics tab that aggregates this data to show performance metrics. This is a read-only UI feature — no backend changes needed since we're using existing post data.

---

#### [MODIFY] [SocialMediaPage.tsx](file:///c:/Users/mike/Documents/Git/SteelCityAI/steelcity-ai.com/client/src/pages/admin/SocialMediaPage.tsx)

- Add `BarChart3`, `TrendingUp`, `Activity` to lucide imports if not already present
- Create new `AnalyticsTab` component (~250 lines):
  - **Overall Metrics Cards**: Total posts, published count, total likes, total reach — computed from post engagement data
  - **Best Performing Posts**: Top 5 posts by engagement (likes + shares + comments), showing content preview and metrics
  - **Platform Breakdown**: Cards per platform showing post count and aggregate engagement
  - **Campaign Performance**: Summary of each campaign's post count and aggregate engagement
  - Uses existing endpoint `/api/admin/social/posts` and `/api/admin/social/campaigns`
- Add new tab trigger and content in the main `SocialMediaPage` component (first position, before Posts)

---

### Feature 4: YouTube Platform + Video Import

**Summary**: Add YouTube to platform lists so users can target it when creating posts, and add a YouTube video import feature that downloads videos from YouTube URLs for use as post media.

---

#### [MODIFY] [SocialMediaPage.tsx](file:///c:/Users/mike/Documents/Git/SteelCityAI/steelcity-ai.com/client/src/pages/admin/SocialMediaPage.tsx)

- Add `SiYoutube` to `react-icons/si` imports (line 28)
- Add YouTube entry to `PLATFORMS` array: `{ id: "youtube", label: "YouTube", icon: SiYoutube, color: "bg-red-600" }` (line ~43)
- Add YouTube import UI in `AIComposeTab`'s Media Attachments card (~line 1158): a text input for YouTube URL + "Import from YouTube" button
- Add state for `youtubeUrl` and `isImportingYoutube`

---

#### [MODIFY] [PortalSocialMedia.tsx](file:///c:/Users/mike/Documents/Git/SteelCityAI/steelcity-ai.com/client/src/pages/portal/PortalSocialMedia.tsx)

- Add `SiYoutube` to `react-icons/si` imports (line 48)
- Add YouTube entry to `PLATFORMS` array (line ~62)

---

#### [MODIFY] [SocialPostPreview.tsx](file:///c:/Users/mike/Documents/Git/SteelCityAI/steelcity-ai.com/client/src/components/SocialPostPreview.tsx)

- Add YouTube to platform icon mapping so previews render the YouTube icon correctly

---

#### [MODIFY] [social-media-routes.ts](file:///c:/Users/mike/Documents/Git/SteelCityAI/steelcity-ai.com/server/social-media-routes.ts)

- Add new endpoint `POST /api/admin/social/media/from-youtube`:
  - Accepts `{ url: string }` body with YouTube video/clip URL
  - Uses YouTube oEmbed API (`https://www.youtube.com/oembed`) to extract title, thumbnail, and metadata
  - Downloads the thumbnail as a media attachment
  - Stores the YouTube URL in the response so it can be embedded or linked
  - Returns `{ url: string, thumbnail: string, title: string, youtubeUrl: string }`

> [!NOTE]
> Direct YouTube video download requires `yt-dlp` system dependency. For now, the import will save the YouTube URL for embedding and download the thumbnail. This avoids external binary dependencies and YouTube ToS concerns. Users can use the YouTube URL as a link in their posts.

---

## Verification Plan

### Automated Tests

Build verification:
```
cd c:\Users\mike\Documents\Git\SteelCityAI\steelcity-ai.com && npx vite build
```

This confirms all TypeScript compiles correctly, no missing imports, and all components are valid.

### Manual Verification

1. **Brand Voice Selector**: Admin → Social Media → AI Compose → verify dropdown appears, selection is sent in API requests.

2. **Content Calendar**: Admin → Social Media → Calendar tab → verify month navigation, post indicators, day dialog.

3. **Analytics Dashboard**: Admin → Social Media → Analytics tab → verify metric cards, best posts, platform/campaign breakdowns.

4. **YouTube**: Admin → Social Media → AI Compose → verify YouTube appears in platform checkboxes. In media section, paste a YouTube URL and click import → verify thumbnail is saved and YouTube URL is stored.

> [!NOTE]
> Since the user needs to manually verify the UI in their browser, I'll focus on ensuring the build passes as the primary automated check. The existing test suite in `routes.test.ts` covers client management routes, not social media routes, so no existing tests need updating.
