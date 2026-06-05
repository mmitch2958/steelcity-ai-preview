# L004: Real-Time Preview Layout + UX Flow
**Agent:** Leia (Design/UX) | **Status:** ✅ Complete

## Desktop Layout (Split-Screen)
- Left column (60-65%): Editor, controls, platform selection, media upload, AI review, actions
- Right column (35-40%): Platform selector tabs + live SocialPostPreview component
- `grid grid-cols-12 gap-8` — editor `col-span-7`, preview `col-span-5`
- Preview column sticky with internal scroll

## Mobile Layout (Stacked)
- Editor/Preview toggle via Tabs or SegmentedControl (sticky top)
- Conditional rendering: show editor OR preview (not both)
- Full-width sections with `overflow-y-auto`

## Component Hierarchy
```
CreatePost
├── PostEditor (left/top)
│   ├── PostControls (mode, platforms, media)
│   ├── PostComposeTextarea (content + character counter)
│   └── ActionButtons (save, schedule)
└── PostPreviewContainer (right/bottom)
    ├── PlatformSelectorTabs (FB, IG, X, LI, YT)
    └── SocialPostPreview (existing component)
        ├── PlatformSpecificCard
        ├── CharacterCounter
        └── HashtagHighlighter
```

## Interaction Patterns
- **Debounce:** 300-500ms on textarea changes before preview update
- **Tab switching:** `activePlatformTab` state controls which preview renders
- **Platform versions:** AI-generated platform-specific content auto-selects per tab
- **Media preview:** Images/videos render inside platform card structure
- **Character count:** Color-coded (green → yellow → red) per platform limits
- **Hashtag highlighting:** `text-blue-500 font-semibold` in preview

## Shadcn/ui Components
- Tabs (platform selector + mobile toggle)
- Textarea, Input, Button, Checkbox
- Badge (character count), Progress (limit bar)
- Card (preview wrapper), Tooltip (platform tips)
- AlertDialog, Toast

## Accessibility
- Semantic HTML throughout
- aria-label, aria-describedby, aria-live="polite" on character count
- role="tablist/tab/tabpanel" with aria-selected
- Full keyboard navigation
- Focus management on mobile view switching
- WCAG 2.1 AA color contrast
