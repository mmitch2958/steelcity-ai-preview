# ADR-001: Social Media Page Component Architecture

**Status:** Accepted  
**Date:** 2026-03-04  
**Author:** Akbar (Principal System Architect)  
**Priority:** P0 — Critical Path  

---

## Context

`PortalSocialMedia.tsx` (3,788 lines) and `SocialMediaPage.tsx` (3,994 lines) are monoliths containing 9 tab components each, 20+ useState calls in CreatePostTab alone, duplicated queries/mutations, and heavy `any` typing. All build tasks depend on this architecture.

**Key constraints discovered from code inspection:**
- Portal uses `/api/portal/social/*` endpoints; Admin uses `/api/admin/social/*`
- Both files share identical constants (`PLATFORMS`, `STATUS_VARIANTS`, `campaignStatusConfig`)
- Both files duplicate identical Zod schemas (`createCampaignSchema`, `createBrandVoiceSchema`, `createAccountSchema`)
- Shared types already exist in `@shared/schema` (`SocialPost`, `SocialCampaign`, `SocialAccount`, `BrandVoiceProfile`)
- `SocialPostPreview` component already extracted to `@/components/SocialPostPreview`
- `queryClient` and `apiRequest` already in `@/lib/queryClient`
- Admin has extra features: client filtering, PlatformBadge helper, `safeStr` utility
- Portal has extra features: autonomous mode, URL scraper, vibe editing

---

## 1. Folder Structure

```
client/src/
├── components/
│   ├── social/                          # SHARED components (portal + admin)
│   │   ├── constants.ts                 # PLATFORMS, STATUS_VARIANTS, campaignStatusConfig
│   │   ├── schemas.ts                   # Zod schemas + form types
│   │   ├── types.ts                     # UI-specific types (AI results, engagement, etc.)
│   │   ├── utils.ts                     # formatDate, formatDateTime, getStatusLabel, safeStr
│   │   ├── PlatformBadge.tsx            # Platform icon+label badge
│   │   ├── PlatformSelector.tsx         # Checkbox grid for selecting platforms
│   │   ├── MediaAttachments.tsx         # Upload, URL input, media grid with remove
│   │   ├── PostCard.tsx                 # Single post display card (used in PostsTab + DashboardTab)
│   │   ├── PostEditDialog.tsx           # Edit/Schedule/Publish dialog
│   │   ├── CampaignCard.tsx             # Campaign card with status badge
│   │   ├── CampaignFormDialog.tsx       # Create/Edit campaign dialog
│   │   ├── BrandVoiceCard.tsx           # Brand voice profile card
│   │   ├── BrandVoiceFormDialog.tsx     # Create/Edit brand voice dialog
│   │   ├── AccountCard.tsx              # Connected account row
│   │   ├── AccountFormDialog.tsx        # Manual add account dialog
│   │   ├── CalendarGrid.tsx             # Month grid with post indicators
│   │   ├── AnalyticsCards.tsx           # Metric cards (likes, shares, etc.)
│   │   └── AiContentResult.tsx          # AI-generated content display + actions
│   │
│   ├── SocialPostPreview.tsx            # EXISTING — leave in place
│   └── ui/                             # EXISTING — shadcn components
│
├── hooks/
│   ├── social/                          # SHARED hooks
│   │   ├── use-social-posts.ts          # Posts query + mutations
│   │   ├── use-social-campaigns.ts      # Campaigns query + mutations
│   │   ├── use-social-accounts.ts       # Accounts query + mutations
│   │   ├── use-brand-voice.ts           # Brand voice query + mutations
│   │   ├── use-social-ai.ts             # AI generation/review/research mutations
│   │   └── use-media-upload.ts          # File upload + URL download logic
│   │
│   ├── use-toast.ts                     # EXISTING
│   └── use-mobile.tsx                   # EXISTING
│
├── pages/
│   ├── portal/
│   │   ├── PortalSocialMedia.tsx        # SLIM wrapper — tabs + layout only (~80 lines)
│   │   ├── social/                      # Portal-specific tab implementations
│   │   │   ├── DashboardTab.tsx
│   │   │   ├── CreatePostTab.tsx        # Portal's 3-mode creator (manual/ai/autonomous)
│   │   │   ├── PostsTab.tsx
│   │   │   ├── CampaignsTab.tsx
│   │   │   ├── AccountsTab.tsx
│   │   │   ├── BrandVoiceTab.tsx
│   │   │   ├── ContentCalendarTab.tsx
│   │   │   └── AnalyticsTab.tsx
│   │   └── PortalLayout.tsx             # EXISTING
│   │
│   └── admin/
│       ├── SocialMediaPage.tsx          # SLIM wrapper — tabs + layout only (~80 lines)
│       └── social/                      # Admin-specific tab implementations
│           ├── PostsTab.tsx             # Has client filter, different create flow
│           ├── AIComposeTab.tsx          # Admin's AI compose (different from portal)
│           ├── CampaignsTab.tsx
│           ├── AccountsTab.tsx          # Has client assignment
│           ├── BrandVoiceTab.tsx
│           ├── ContentCalendarTab.tsx
│           └── AnalyticsTab.tsx
```

---

## 2. Shared Hooks

Each hook takes a `mode` parameter to switch API base paths.

### `use-social-posts.ts`

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { SocialPost } from '@shared/schema';

type ApiMode = 'portal' | 'admin';

function basePath(mode: ApiMode) {
  return mode === 'admin' ? '/api/admin/social' : '/api/portal/social';
}

export function useSocialPosts(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/posts`];

  const query = useQuery<{ posts: SocialPost[] } | SocialPost[]>({
    queryKey,
  });

  // Normalize response shape (API returns either array or { posts: [] })
  const posts: SocialPost[] = Array.isArray(query.data)
    ? query.data
    : query.data?.posts ?? [];

  return { ...query, posts, queryKey };
}

export function useCreatePost(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/posts`];

  return useMutation({
    mutationFn: async (payload: {
      content: string;
      platforms: string[];
      hashtags?: string[];
      scheduledAt?: string;
      mediaUrls?: string[];
      campaignId?: string;
      accountIds?: string[];
      status?: string;
      aiGenerated?: boolean;
    }) => {
      const res = await apiRequest('POST', `${base}/posts`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdatePost(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/posts`];

  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; [key: string]: any }) => {
      const res = await apiRequest('PUT', `${base}/posts/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeletePost(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/posts`];

  return useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest('DELETE', `${base}/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function usePublishPost(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/posts`];

  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiRequest('POST', `${base}/posts/${postId}/publish`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
```

### `use-social-campaigns.ts`

```typescript
export function useSocialCampaigns(mode: ApiMode) {
  // query: GET ${base}/campaigns → SocialCampaign[]
  // returns { campaigns, ...query, queryKey }
}

export function useCreateCampaign(mode: ApiMode) {
  // mutationFn: POST ${base}/campaigns
}

export function useUpdateCampaign(mode: ApiMode) {
  // mutationFn: PUT ${base}/campaigns/${id}
}

export function useDeleteCampaign(mode: ApiMode) {
  // mutationFn: DELETE ${base}/campaigns/${id}
}
```

### `use-social-accounts.ts`

```typescript
export function useSocialAccounts(mode: ApiMode) {
  // query: GET ${base}/accounts → SocialAccount[]
  // normalizes { accounts: [] } | []
}

export function useCreateAccount(mode: ApiMode) {
  // mutationFn: POST ${base}/accounts
}

export function useDisconnectAccount(mode: ApiMode) {
  // mutationFn: DELETE ${base}/accounts/${id}
}
```

### `use-brand-voice.ts`

```typescript
export function useBrandVoices(mode: ApiMode) {
  // query: GET ${base}/brand-voice → BrandVoiceProfile[]
}

export function useSaveBrandVoice(mode: ApiMode) {
  // mutationFn: POST or PUT depending on editingId
}

export function useDeleteBrandVoice(mode: ApiMode) {
  // mutationFn: DELETE ${base}/brand-voice/${id}
}
```

### `use-social-ai.ts`

```typescript
// Portal-only AI mutations (admin has its own AI compose flow)
export function useAiOrchestrate() {
  return useMutation({
    mutationFn: async (params: {
      briefing: string;
      platforms: string[];
      brandVoiceId?: string;
    }) => {
      const res = await apiRequest('POST', '/api/portal/social/ai/orchestrate', params);
      return res.json();
    },
  });
}

export function useAiGeneratePost() { /* POST /api/portal/social/ai/generate-post */ }
export function useAiVibeEdit() { /* POST /api/portal/social/ai/vibe-edit */ }
export function useAiReview() { /* POST /api/portal/social/ai/review */ }
export function useAiResearch() { /* POST /api/portal/social/ai/research */ }
export function useAiDesign() { /* POST /api/portal/social/ai/design */ }
export function useAiAutonomous() { /* POST /api/portal/social/ai/autonomous */ }
export function useAiGenerateImage() { /* POST /api/portal/social/ai/generate-image */ }
export function useAiGenerateVideo() { /* POST /api/portal/social/video/generate or ai/generate-video */ }

// Admin AI mutations use /api/admin/social/ai/* — same hook pattern, different base
export function useAdminAiGenerate() { /* POST /api/admin/social/ai/generate */ }
export function useAdminAiOrchestrate() { /* POST /api/admin/social/ai/orchestrate */ }
```

### `use-media-upload.ts`

```typescript
import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type ApiMode = 'portal' | 'admin';

export function useMediaUpload(mode: ApiMode) {
  const { toast } = useToast();
  const base = mode === 'admin' ? '/api/admin/social' : '/api/portal/social';
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingUrl, setIsAddingUrl] = useState(false);

  const uploadFiles = async (
    files: FileList,
    onSuccess: (urls: string[]) => void
  ) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('files', f));
      const res = await fetch(`${base}/media/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      const urls = data.urls ?? (data.url ? [data.url] : []);
      onSuccess(urls);
      toast({ title: 'Files uploaded', description: `${urls.length} file(s) uploaded.` });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const addFromUrl = async (
    url: string,
    onSuccess: (downloadedUrl: string) => void
  ) => {
    setIsAddingUrl(true);
    try {
      const res = await apiRequest('POST', `${base}/media/from-url`, { url });
      const data = await res.json();
      if (data.url) onSuccess(data.url);
    } catch (err: any) {
      toast({ title: 'Failed to add media', description: err.message, variant: 'destructive' });
    } finally {
      setIsAddingUrl(false);
    }
  };

  return { uploadFiles, addFromUrl, isUploading, isAddingUrl };
}
```

---

## 3. State Management — CreatePostTab

The CreatePostTab has 27 useState calls. Strategy: **useReducer + composition**, not Context.

Context is overkill — this state doesn't cross component boundaries. A reducer consolidates related state transitions and makes resets trivial.

### Reducer for CreatePostTab

```typescript
// pages/portal/social/create-post-state.ts

export interface CreatePostState {
  // Mode
  mode: 'manual' | 'ai' | 'autonomous';

  // Content
  content: string;
  selectedPlatforms: string[];
  scheduledAt: string;
  hashtags: string;
  briefing: string;
  selectedBrandVoiceId: string;

  // AI results
  aiResult: any | null;        // TODO: type as AiContentResult in phase 2
  reviewResult: any | null;    // TODO: type as ReviewResult
  designResult: any | null;    // TODO: type as DesignResult
  autonomousResult: any | null;
  researchResult: any | null;
  scrapedData: any | null;

  // Media
  mediaUrls: string[];
  mediaUrlInput: string;
  videoSource: 'stock' | 'ai';
  videoPrompt: string;
  scrapeUrlInput: string;

  // UI flags
  vibeDirection: string;
  showResearch: boolean;
  autoPost: boolean;
  isEditingContent: boolean;

  // Loading states managed by mutations — NOT in reducer
}

type Action =
  | { type: 'SET_MODE'; mode: CreatePostState['mode'] }
  | { type: 'SET_FIELD'; field: keyof CreatePostState; value: any }
  | { type: 'TOGGLE_PLATFORM'; platformId: string }
  | { type: 'ADD_MEDIA'; urls: string[] }
  | { type: 'REMOVE_MEDIA'; index: number }
  | { type: 'APPLY_AI_CONTENT'; aiResult: any }
  | { type: 'RESET_FORM' }
  | { type: 'RESET_AI' };

export const initialState: CreatePostState = {
  mode: 'manual',
  content: '',
  selectedPlatforms: [],
  scheduledAt: '',
  hashtags: '',
  briefing: '',
  selectedBrandVoiceId: '',
  aiResult: null,
  reviewResult: null,
  designResult: null,
  autonomousResult: null,
  researchResult: null,
  scrapedData: null,
  mediaUrls: [],
  mediaUrlInput: '',
  videoSource: 'stock',
  videoPrompt: '',
  scrapeUrlInput: '',
  vibeDirection: '',
  showResearch: false,
  autoPost: false,
  isEditingContent: false,
};

export function createPostReducer(state: CreatePostState, action: Action): CreatePostState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'TOGGLE_PLATFORM':
      return {
        ...state,
        selectedPlatforms: state.selectedPlatforms.includes(action.platformId)
          ? state.selectedPlatforms.filter((p) => p !== action.platformId)
          : [...state.selectedPlatforms, action.platformId],
      };

    case 'ADD_MEDIA':
      return { ...state, mediaUrls: [...state.mediaUrls, ...action.urls] };

    case 'REMOVE_MEDIA':
      return { ...state, mediaUrls: state.mediaUrls.filter((_, i) => i !== action.index) };

    case 'APPLY_AI_CONTENT':
      return {
        ...state,
        content: action.aiResult?.content ?? state.content,
        hashtags: Array.isArray(action.aiResult?.hashtags)
          ? action.aiResult.hashtags.join(', ')
          : state.hashtags,
        aiResult: action.aiResult,
      };

    case 'RESET_FORM':
      return { ...initialState };

    case 'RESET_AI':
      return {
        ...state,
        aiResult: null,
        reviewResult: null,
        designResult: null,
        autonomousResult: null,
        researchResult: null,
      };

    default:
      return state;
  }
}
```

### Usage in CreatePostTab

```tsx
// pages/portal/social/CreatePostTab.tsx
import { useReducer } from 'react';
import { createPostReducer, initialState } from './create-post-state';

export function CreatePostTab() {
  const [state, dispatch] = useReducer(createPostReducer, initialState);

  // Mutations from hooks — loading states stay with mutations
  const createPost = useCreatePost('portal');
  const aiOrchestrate = useAiOrchestrate();
  const mediaUpload = useMediaUpload('portal');

  // Clean dispatch calls instead of 27 setters
  // dispatch({ type: 'TOGGLE_PLATFORM', platformId: 'facebook' })
  // dispatch({ type: 'SET_FIELD', field: 'content', value: 'Hello' })
  // dispatch({ type: 'RESET_FORM' })

  // Decompose the render into sub-sections:
  return (
    <div className="space-y-6">
      <ModeSelector mode={state.mode} onModeChange={(m) => dispatch({ type: 'SET_MODE', mode: m })} />

      {state.mode === 'autonomous' && (
        <AutonomousSection state={state} dispatch={dispatch} />
      )}

      {state.mode === 'ai' && (
        <AiStudioSection state={state} dispatch={dispatch} />
      )}

      {state.mode !== 'autonomous' && (
        <ComposeSection state={state} dispatch={dispatch} />
      )}
    </div>
  );
}
```

The sub-sections (`AutonomousSection`, `AiStudioSection`, `ComposeSection`) are **private components within CreatePostTab.tsx** — NOT separate files. They receive `state` and `dispatch` as props. This avoids prop-drilling pain while keeping the render manageable.

---

## 4. TypeScript Strategy

### Where types live

| Type Source | Location | Convention |
|---|---|---|
| DB entities | `@shared/schema` | `SocialPost`, `SocialAccount`, `BrandVoiceProfile`, `SocialCampaign` — **already exist, USE THEM** |
| Zod form schemas | `@/components/social/schemas.ts` | `createCampaignSchema`, `CreateCampaignForm` (inferred) |
| UI-specific types | `@/components/social/types.ts` | Prefixed with purpose: `AiContentResult`, `ReviewResult`, `DesignSuggestion`, `ResearchResult` |
| Hook return types | Inline in hook files | Inferred by TanStack Query generics |
| Component props | Co-located in component file | `interface PostCardProps`, `interface CampaignFormDialogProps` |

### Naming convention
- **Types:** PascalCase, noun-based (`SocialPost`, `AiContentResult`)
- **Schemas:** camelCase (`createPostSchema`)
- **Form types:** `Create*Form`, `Update*Form` (derived from schema with `z.infer`)

### Eliminating `any`

Phase the `any` removal:
1. **Immediate (during extraction):** Replace all query generics with proper types from `@shared/schema`. Example:
   ```typescript
   // BEFORE
   const { data: postsData } = useQuery<any>({ queryKey: [...] });
   
   // AFTER
   const { posts } = useSocialPosts('portal');
   // Hook internally handles: useQuery<{ posts: SocialPost[] } | SocialPost[]>
   ```

2. **AI result types (phase 2):** Create proper interfaces for AI response shapes. Temporary approach — cast at hook boundary, type within components:
   ```typescript
   // components/social/types.ts
   export interface AiContentResult {
     content?: string;
     hashtags?: string[];
     platformVersions?: Record<string, string | { content: string }>;
     research?: AiResearch;
     designSuggestions?: DesignSuggestion;
     review?: ReviewResult;
   }
   ```

---

## 5. Error Boundaries

### Granularity: Per-Tab

```tsx
// components/social/SocialTabErrorBoundary.tsx
import { Component, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  tabName: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SocialTabErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
            <div>
              <h3 className="font-semibold text-lg">Something went wrong in {this.props.tabName}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {this.state.error?.message || 'An unexpected error occurred.'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}
```

### Usage in wrapper

```tsx
<TabsContent value="create">
  <SocialTabErrorBoundary tabName="AI Compose">
    <CreatePostTab />
  </SocialTabErrorBoundary>
</TabsContent>
```

**Why per-tab, not per-section:** A crash in one tab shouldn't take down the entire page. But within a tab, sections are tightly coupled (e.g., AI result feeds into compose section) — a per-section boundary would leave the tab in an inconsistent state.

---

## 6. Lazy Loading

### Which components to lazy load

Only the heavy tabs. DashboardTab is the default and should load eagerly.

```tsx
// pages/portal/PortalSocialMedia.tsx
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Eagerly loaded — it's the default tab
import { DashboardTab } from './social/DashboardTab';

// Lazy loaded — only needed on tab switch
const CreatePostTab = lazy(() => import('./social/CreatePostTab'));
const PostsTab = lazy(() => import('./social/PostsTab'));
const CampaignsTab = lazy(() => import('./social/CampaignsTab'));
const AccountsTab = lazy(() => import('./social/AccountsTab'));
const BrandVoiceTab = lazy(() => import('./social/BrandVoiceTab'));
const ContentCalendarTab = lazy(() => import('./social/ContentCalendarTab'));
const AnalyticsTab = lazy(() => import('./social/AnalyticsTab'));

function TabFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

// In render:
<TabsContent value="create">
  <SocialTabErrorBoundary tabName="AI Compose">
    <Suspense fallback={<TabFallback />}>
      <CreatePostTab />
    </Suspense>
  </SocialTabErrorBoundary>
</TabsContent>
```

**Each tab file must use `export default`** for `lazy()` to work:

```tsx
// pages/portal/social/CreatePostTab.tsx
export default function CreatePostTab() { ... }
```

---

## 7. Admin Parity Strategy

### Decision: Shared components, separate tab files

The admin and portal pages have the same *structure* but different *behavior*:

| Difference | Portal | Admin |
|---|---|---|
| API base | `/api/portal/social/*` | `/api/admin/social/*` |
| Client scope | Implicit (from session) | Explicit (client selector dropdown) |
| AI Compose | 3 modes (manual/ai/autonomous) | Different AI panel layout |
| Accounts | OAuth connect + manual add | Manual add with client assignment |
| Posts list | No client filter | Client filter dropdown |

### What's shared (in `components/social/`)

1. **Constants** — `PLATFORMS`, `STATUS_VARIANTS`, `campaignStatusConfig`
2. **Schemas** — all Zod schemas (identical between files)
3. **Utils** — `formatDate`, `formatDateTime`, `getStatusLabel`, `safeStr`
4. **Hooks** — all data hooks (parameterized by `mode: 'portal' | 'admin'`)
5. **Presentational components** — `PostCard`, `CampaignCard`, `BrandVoiceCard`, `CalendarGrid`, `AnalyticsCards`, `PlatformBadge`, `PlatformSelector`, `MediaAttachments`

### What stays separate (in `pages/*/social/`)

Each tab file. They wire hooks + shared components with page-specific logic.

### Example: PostCard (shared)

```tsx
// components/social/PostCard.tsx
import type { SocialPost, SocialAccount } from '@shared/schema';
import { PLATFORMS, STATUS_VARIANTS, getStatusLabel, formatDate } from './constants';
import { SocialPostPreview } from '@/components/SocialPostPreview';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Send, Copy, Trash2, Clock, Heart, Share2, MessageSquare, Eye } from 'lucide-react';

interface PostCardProps {
  post: SocialPost;
  accounts: SocialAccount[];
  onEdit?: (post: SocialPost) => void;
  onPublish?: (postId: string) => void;
  onDuplicate?: (post: SocialPost) => void;
  onDelete?: (postId: string) => void;
  isPublishing?: boolean;
  isDuplicating?: boolean;
  isDeleting?: boolean;
  /** Admin shows client name badge */
  clientName?: string;
}

export function PostCard({
  post,
  accounts,
  onEdit,
  onPublish,
  onDuplicate,
  onDelete,
  isPublishing,
  isDuplicating,
  isDeleting,
  clientName,
}: PostCardProps) {
  const firstAccountId = post.accountIds?.[0];
  const matchedAccount = firstAccountId
    ? accounts.find((a) => a.id === firstAccountId)
    : accounts.find((a) => post.platforms?.[0] && a.platform === post.platforms[0]);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* ... platform badges, status, action buttons */}
        {/* Reuses SocialPostPreview */}
        {/* Engagement metrics if present */}
        {clientName && <Badge variant="outline">{clientName}</Badge>}
      </CardContent>
    </Card>
  );
}
```

### Example: Portal PostsTab using shared components

```tsx
// pages/portal/social/PostsTab.tsx
import { useState } from 'react';
import { useSocialPosts, useCreatePost, usePublishPost, useDeletePost } from '@/hooks/social/use-social-posts';
import { useSocialAccounts } from '@/hooks/social/use-social-accounts';
import { useSocialCampaigns } from '@/hooks/social/use-social-campaigns';
import { PostCard } from '@/components/social/PostCard';
import { PostEditDialog } from '@/components/social/PostEditDialog';
import { useToast } from '@/hooks/use-toast';

export default function PostsTab() {
  const { toast } = useToast();
  const { posts, isLoading } = useSocialPosts('portal');
  const { accounts } = useSocialAccounts('portal');
  const { campaigns } = useSocialCampaigns('portal');
  const publishPost = usePublishPost('portal');
  const deletePost = useDeletePost('portal');

  const [statusFilter, setStatusFilter] = useState('all');
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);

  const filteredPosts = statusFilter === 'all'
    ? posts
    : posts.filter((p) => p.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Filter bar + Create button */}
      {filteredPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          accounts={accounts}
          onEdit={setEditingPost}
          onPublish={(id) => publishPost.mutate(id, {
            onSuccess: (data) => {
              /* toast logic */
            },
          })}
          onDelete={(id) => deletePost.mutate(id, {
            onSuccess: () => toast({ title: 'Post deleted' }),
          })}
          isPublishing={publishPost.isPending}
        />
      ))}
      <PostEditDialog
        post={editingPost}
        onClose={() => setEditingPost(null)}
        mode="portal"
      />
    </div>
  );
}
```

---

## 8. Implementation Order

Luke should extract in this order to minimize risk:

| Step | What | Risk | Lines Removed |
|---|---|---|---|
| 1 | `components/social/constants.ts` + `schemas.ts` + `utils.ts` + `types.ts` | Zero — pure extraction, no behavior change | ~100 |
| 2 | All 6 hooks in `hooks/social/` | Low — test by importing in existing monolith first | ~0 (new files) |
| 3 | Shared presentational components (`PlatformBadge`, `PlatformSelector`, `MediaAttachments`, `PostCard`) | Low — replace inline JSX with component calls | ~200 |
| 4 | Extract each portal tab to `pages/portal/social/*.tsx` starting with simplest: `DashboardTab` → `AnalyticsTab` → `ContentCalendarTab` → `AccountsTab` → `BrandVoiceTab` → `CampaignsTab` → `PostsTab` → `CreatePostTab` | Medium — test each tab after extraction | ~3700 |
| 5 | Slim down `PortalSocialMedia.tsx` to wrapper + lazy imports | Low — just wiring | n/a |
| 6 | Repeat steps 4-5 for admin `SocialMediaPage.tsx` | Medium | ~3900 |
| 7 | Add error boundaries + Suspense wrappers | Low | ~0 |

### Critical rule for Luke:
**After extracting each tab, verify the page still works before moving to the next.** Don't extract all tabs at once.

---

## 9. Constants & Schemas File

```typescript
// components/social/constants.ts
import { SiFacebook, SiInstagram, SiX, SiLinkedin, SiYoutube } from 'react-icons/si';

export const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: SiFacebook, color: 'bg-blue-600' },
  { id: 'instagram', label: 'Instagram', icon: SiInstagram, color: 'bg-pink-600' },
  { id: 'x', label: 'X', icon: SiX, color: 'bg-neutral-800 dark:bg-neutral-200 dark:text-neutral-800' },
  { id: 'linkedin', label: 'LinkedIn', icon: SiLinkedin, color: 'bg-blue-700' },
  { id: 'youtube', label: 'YouTube', icon: SiYoutube, color: 'bg-red-600' },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]['id'];

export const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  scheduled: 'secondary',
  published: 'default',
  failed: 'destructive',
};

export const campaignStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'outline' },
  completed: { label: 'Completed', variant: 'secondary' },
};
```

```typescript
// components/social/schemas.ts
import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).default('draft'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetAudience: z.string().optional(),
  goals: z.string().optional(),
});

export const createBrandVoiceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tone: z.string().optional(),
  style: z.string().optional(),
  vocabulary: z.string().optional(),
  avoidWords: z.string().optional(),
  examplePosts: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const createAccountSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  accountName: z.string().min(1, 'Account name is required'),
  username: z.string().min(1, 'Username is required'),
  clientId: z.string().optional(), // Admin only
});

export const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  platforms: z.array(z.string()).min(1, 'Select at least one platform'),
  accountIds: z.array(z.string()).optional(),
  scheduledAt: z.string().optional(),
  hashtags: z.string().optional(),
  campaignId: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
});

export type CreateCampaignForm = z.infer<typeof createCampaignSchema>;
export type CreateBrandVoiceForm = z.infer<typeof createBrandVoiceSchema>;
export type CreateAccountForm = z.infer<typeof createAccountSchema>;
export type CreatePostForm = z.infer<typeof createPostSchema>;
```

```typescript
// components/social/utils.ts
export function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleString();
}

export function safeStr(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return JSON.stringify(val);
}
```

---

## 10. SelectItem Safety

**CRITICAL:** Never use `value=""` in `<SelectItem>`. This causes a white-screen crash with Radix.

Use `value="none"` or `value="all"` as sentinel values:

```tsx
// ✅ CORRECT
<SelectItem value="none">Default</SelectItem>
<SelectItem value="all">All Posts</SelectItem>

// ❌ WILL CRASH
<SelectItem value="">Default</SelectItem>
```

Every hook that receives these sentinel values must filter them:

```typescript
// In hook or handler
const brandVoiceId = selectedBrandVoiceId === 'none' ? undefined : selectedBrandVoiceId;
const campaignId = selectedCampaignId === 'none' ? undefined : selectedCampaignId;
```

---

## Summary

| Aspect | Decision |
|---|---|
| Folder structure | `components/social/` (shared) + `pages/*/social/` (per-role tabs) |
| Hooks | 6 shared hooks parameterized by `ApiMode` |
| CreatePostTab state | `useReducer` with typed actions, sub-sections as private components |
| Types | Use `@shared/schema` types for entities, co-locate UI types |
| Error boundaries | Per-tab `SocialTabErrorBoundary` |
| Lazy loading | All tabs except DashboardTab via `React.lazy` + `Suspense` |
| Admin parity | Same hooks + shared components, separate tab files |
| Extraction order | Constants → Hooks → Shared components → Tabs (simple→complex) → Wrapper → Admin |
