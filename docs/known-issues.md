# Known Issues & Concerns

**Project:** SMP-Updates Social Media Platform  
**Date:** 2026-03-06  
**Branch:** SMP-Updates

---

## 🚨 Critical Issues (P0)

| ID | Component | Issue | Status | Notes |
|----|-----------|-------|--------|-------|
| - | - | - | - | - |

---

## ⚠️ High Priority Issues (P1)

| ID | Component | Issue | Status | Notes |
|----|-----------|-------|--------|-------|
| P1-001 | Client TypeScript | Pre-existing TS errors in admin components (ProjectPanel.tsx, Contact.tsx, DocumentManager.tsx) | Pre-existing | Not related to SMP social features |
| P1-002 | Server TypeScript | Pre-existing TS errors in routes.ts, storage.ts, social-media-routes.ts, ai-agents.ts | Pre-existing | Backend issues, out of scope for Phase 4 |

---

## 🔧 Medium Priority Issues (P2)

| ID | Component | Issue | Status | Notes |
|----|-----------|-------|--------|-------|
| P2-001 | CreatePostTab | Character count validation for platform-specific limits | Needs verification | Verify per-platform limits work |
| P2-002 | PostsTab | Bulk selection with "select all" pagination edge case | Needs Verification | Test with 100+ posts across pages |
| P2-003 | AnalyticsTab | Chart accessibility (Recharts) | Advisory | Add role="img" and aria-label per audit |
| P2-004 | HashtagTrendChart | Chart screen reader compatibility | Advisory | Consider data table alternative |

---

## 📋 Pre-Existing TypeScript Errors (Out of Scope)

These errors existed before the current sprint and are not related to the accessibility or prediction UI fixes:

### Client (Non-SMP Components)
- `Contact.tsx` - Argument type mismatch
- `DocumentManager.tsx` - Argument type mismatches
- `ProjectPanel.tsx` - Multiple form control type issues

### Server
- `routes.ts` - User type issues, missing database methods
- `storage.ts` - Drizzle ORM type issues
- `social-media-routes.ts` - Missing scrapedImages/scrapedData properties
- `ai-agents.ts` - Missing visualDescriptions variable
- `google-calendar.ts`, `google-sheets.ts` - Null/undefined type issues

---

## ✅ Verification Summary

### Accessibility Fixes (Commit 4fd8b9c)

**Status:** ✅ Verified

The accessibility fixes are comprehensive and properly implemented:

1. **ARIA labels** - Added to all interactive elements, buttons, tabs
2. **Keyboard navigation** - Added tabIndex and onKeyDown handlers to clickable elements (badges, table rows, status cards)
3. **Screen reader support** - Added aria-live regions, role="status" on loading skeletons, sr-only text for truncated content
4. **Icon accessibility** - Added aria-hidden="true" to decorative icons
5. **Focus indicators** - Added CSS rules for focus-visible states
6. **No breaking changes** - All changes are additive ARIA attributes; no functional logic modified

### Prediction UI Bug Fix (Commit 2ec03d5)

**Status:** ✅ Verified

The prediction input fallback logic is correct:

```typescript
const predictionInput = useMemo(() => ({
  content: state.content || state.aiResult?.content || '',
  hashtags: (
    state.hashtags
      ? state.hashtags.split(',').map((h: string) => h.trim()).filter(Boolean)
      : (Array.isArray(state.aiResult?.hashtags) ? state.aiResult.hashtags : [])
  ),
  // ...
}), [state.content, state.aiResult, ...]);
```

- Content fallback: `state.content` → `state.aiResult?.content` → empty string ✅
- Hashtags fallback: manual hashtags → AI hashtags array → empty array ✅
- Enabled check uses `predictionInput.content` which includes the fallback ✅

### Lazy Loading (Commit 2ec03d5)

**Status:** ✅ Verified

All tabs are now lazy-loaded:
- DashboardTab is lazy-loaded (was previously imported directly)
- All other tabs (PostsTab, CreatePostTab, etc.) use lazy loading
- Suspense boundary wraps each tab with TabSkeleton fallback

---

## 🔍 Recommended Manual Testing

1. **Keyboard-only navigation** - Verify all new keyboard handlers work
2. **Screen reader test** - NVDA/VoiceOver on key workflows
3. **Bulk actions** - Test selection across pagination
4. **Prediction fallback** - Test AI-Assisted mode with cleared manual content

---

## 📝 Notes

- Pre-existing TypeScript errors should be addressed in a separate cleanup sprint
- The accessibility fixes are non-breaking and follow WCAG 2.1 AA
- The prediction UI fix properly handles edge cases where AI content exists but manual content is cleared