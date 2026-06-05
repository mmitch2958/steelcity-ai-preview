# Pre-Launch Verification Checklist

**Project:** SMP-Updates Social Media Platform  
**Date:** 2026-03-06  
**Branch:** SMP-Updates  
**Status:** 🔄 Ready for Testing

---

## 1. 🎯 Tab Loading & Performance

| ID | Checkpoint | Priority | Verification Method | Status |
|----|------------|----------|---------------------|--------|
| PL-001 | Dashboard tab loads lazily (code splitting) | P0 | Verify network tab shows separate chunk | ⏸️ |
| PL-002 | Posts tab loads lazily | P0 | Verify network tab shows separate chunk | ⏸️ |
| PL-003 | Create Post tab loads lazily | P0 | Verify network tab shows separate chunk | ⏸️ |
| PL-004 | Campaigns tab loads lazily | P0 | Verify network tab shows separate chunk | ⏸️ |
| PL-005 | Accounts tab loads lazily | P0 | Verify network tab shows separate chunk | ⏸️ |
| PL-006 | Brand Voice tab loads lazily | P0 | Verify network tab shows separate chunk | ⏸️ |
| PL-007 | Calendar tab loads lazily | P0 | Verify network tab shows separate chunk | ⏸️ |
| PL-008 | Analytics tab loads lazily | P0 | Verify network tab shows separate chunk | ⏸️ |
| PL-009 | Approvals tab loads lazily | P0 | Verify network tab shows separate chunk | ⏸️ |
| PL-010 | Initial page load < 3s | P1 | Lighthouse audit | ⏸️ |
| PL-011 | Tab skeleton shows during load | P1 | Visual inspection | ⏸️ |
| PL-012 | No layout shift (CLS) on tab switch | P1 | DevTools Performance | ⏸️ |

---

## 2. 🎯 Prediction UI - Manual Mode

| ID | Checkpoint | Priority | Verification Method | Status |
|----|------------|----------|---------------------|--------|
| PR-M001 | Prediction shows after entering 5+ chars | P0 | Enter content, verify score appears | ⏸️ |
| PR-M002 | Score gauge displays correctly (0-10) | P0 | Visual: check SVG gauge renders | ⏸️ |
| PR-M003 | Rating label displays (Poor/Fair/Good/Great) | P0 | Visual: badge shows below gauge | ⏸️ |
| PR-M004 | Confidence bar shows percentage | P0 | Visual: progressbar with % value | ⏸️ |
| PR-M005 | Factor breakdown shows impact items | P0 | Check list of positive/negative factors | ⏸️ |
| PR-M006 | Suggestions show with "Apply" buttons | P1 | Check suggestion cards appear | ⏸️ |
| PR-M007 | Low confidence warning shows (<50%) | P1 | Test with minimal content | ⏸️ |
| PR-M008 | Prediction clears when content < 5 chars | P1 | Delete content, verify hide | ⏸️ |

---

## 3. 🎯 Prediction UI - AI-Assisted Mode

| ID | Checkpoint | Priority | Verification Method | Status |
|----|------------|----------|---------------------|--------|
| PR-A001 | AI-generated content triggers prediction | P0 | Generate AI post, verify score | ⏸️ |
| PR-A002 | Prediction uses aiResult.content as fallback | P0 | Clear manual content, keep AI result | ⏸️ |
| PR-A003 | Prediction uses aiResult.hashtags as fallback | P0 | No manual hashtags, check AI hashtags used | ⏸️ |
| PR-A004 | Score displays for AI-generated content | P0 | Visual: gauge shows for AI content | ⏸️ |
| PR-A005 | Suggestions apply correctly | P1 | Click Apply, verify content changes | ⏸️ |

---

## 4. 🎯 Hashtag Suggestions

| ID | Checkpoint | Priority | Verification Method | Status |
|----|------------|----------|---------------------|--------|
| HT-001 | Suggestions appear when typing content | P0 | Type topic, verify chips appear | ⏸️ |
| HT-002 | Each hashtag chip has accessible label | P0 | Screen reader or ARIA inspector | ⏸️ |
| HT-003 | Clicking chip adds hashtag to input | P0 | Click chip, verify textarea updates | ⏸️ |
| HT-004 | Trending hashtags show indicator | P0 | Check for trending badge/icon | ⏸️ |
| HT-005 | Hashtag reason shows on hover/focus | P1 | Verify tooltip or accessible description | ⏸️ |
| HT-006 | Maximum 6 suggestions shown | P1 | Verify no overflow | ⏸️ |

---

## 5. 🎯 Approval Queue Tab

| ID | Checkpoint | Priority | Verification Method | Status |
|----|------------|----------|---------------------|--------|
| AQ-001 | Pending approvals load | P0 | Navigate to Approvals tab | ⏸️ |
| AQ-002 | Status filter works (pending/approved/rejected) | P0 | Select each filter option | ⏸️ |
| AQ-003 | Status cards are keyboard accessible | P0 | Tab to cards, press Enter | ⏸️ |
| AQ-004 | Post preview shows full content | P0 | Check sr-only text for screen reader | ⏸️ |
| AQ-005 | Approve button works | P0 | Click Approve, verify status change | ⏸️ |
| AQ-006 | Reject button works | P0 | Click Reject, verify status change | ⏸️ |
| AQ-007 | Request Changes works | P0 | Click Request Changes, verify status | ⏸️ |
| AQ-008 | Comment dialog has accessible label | P0 | ARIA inspector on textarea | ⏸️ |
| AQ-009 | Approval history dialog accessible | P0 | Check aria-describedby present | ⏸️ |

---

## 6. 🎯 Bulk Actions

| ID | Checkpoint | Priority | Verification Method | Status |
|----|------------|----------|---------------------|--------|
| BK-001 | Select single post checkbox | P0 | Click checkbox, verify selection | ⏸️ |
| BK-002 | Select multiple posts | P0 | Click multiple checkboxes | ⏸️ |
| BK-003 | Bulk action bar appears when selected | P0 | Select posts, verify toolbar shows | ⏸️ |
| BK-004 | Bulk action bar has accessible label | P0 | Check role="region" aria-label | ⏸️ |
| BK-005 | Selection count announced to screen readers | P0 | Check aria-live region | ⏸️ |
| BK-006 | Bulk delete works | P0 | Select posts, click Delete, confirm | ⏸️ |
| BK-007 | Bulk schedule works | P0 | Select posts, choose new date | ⏸️ |
| BK-008 | Clear selection button works | P0 | Click X button, verify cleared | ⏸️ |
| BK-009 | Bulk actions disabled when nothing selected | P1 | Verify buttons disabled | ⏸️ |

---

## 7. 🎯 Calendar Drag-to-Reschedule

| ID | Checkpoint | Priority | Verification Method | Status |
|----|------------|----------|---------------------|--------|
| CA-001 | Calendar renders current month | P0 | Navigate to Calendar tab | ⏸️ |
| CA-002 | Posts show on correct dates | P0 | Check post chips on dates | ⏸️ |
| CA-003 | Drag post to new date | P0 | Drag chip to different day | ⏸️ |
| CA-004 | Post reschedules after drop | P0 | Verify new date in database/UI | ⏸️ |
| CA-005 | Undo snackbar appears | P0 | Verify "Undo" option shows | ⏸️ |
| CA-006 | Undo restores original date | P0 | Click Undo, verify date restored | ⏸️ |
| CA-007 | Drag has accessible keyboard support | P0 | Tab to post, use arrow keys | ⏸️ |
| CA-008 | Calendar navigation works | P0 | Click prev/next month buttons | ⏸️ |
| CA-009 | Month label announces to screen readers | P0 | Check aria-live on month display | ⏸️ |

---

## 8. 🎯 Templates & Drafts Auto-Save

| ID | Checkpoint | Priority | Verification Method | Status |
|----|------------|----------|---------------------|--------|
| TD-001 | Template picker opens | P0 | Click template button | ⏸️ |
| TD-002 | Templates display in gallery | P0 | Check grid of templates | ⏸️ |
| TD-003 | Selecting template populates content | P0 | Click template, verify textarea | ⏸️ |
| TD-004 | Draft auto-saves on content change | P0 | Type content, wait 2s, refresh | ⏸️ |
| TD-005 | Draft restores on page reload | P0 | Reload page, verify content restored | ⏸️ |
| TD-006 | Auto-save indicator shows status | P1 | Check "Saving..." / "Saved" text | ⏸️ |
| TD-007 | Draft clears after publish | P0 | Publish post, reload, verify empty | ⏸️ |
| TD-008 | Manual save draft button works | P1 | Click Save Draft, verify toast | ⏸️ |

---

## 9. 🎯 Error Boundaries

| ID | Checkpoint | Priority | Verification Method | Status |
|----|------------|----------|---------------------|--------|
| EB-001 | Tab error shows friendly message | P0 | Force error in component | ⏸️ |
| EB-002 | Error boundary has "Try Again" button | P0 | Check for retry action | ⏸️ |
| EB-003 | Error doesn't crash entire app | P0 | Verify other tabs work | ⏸️ |
| EB-004 | Network error displays toast | P1 | Disconnect network, perform action | ⏸️ |
| EB-005 | API error shows user-friendly message | P1 | Trigger API error, check response | ⏸️ |

---

## 10. 🎯 Accessibility Verification

| ID | Checkpoint | Priority | Verification Method | Status |
|----|------------|----------|---------------------|--------|
| A11Y-001 | All tabs have accessible names | P0 | Check aria-label on Tabs | ⏸️ |
| A11Y-002 | Focus indicators visible on all interactive elements | P0 | Tab through page, verify ring | ⏸️ |
| A11Y-003 | Screen reader announces loading states | P0 | NVDA/VoiceOver test | ⏸️ |
| A11Y-004 | Color contrast meets AA (4.5:1) | P0 | Axe DevTools check | ⏸️ |
| A11Y-005 | Drag-and-drop has keyboard support | P0 | Calendar drag with keyboard | ⏸️ |
| A11Y-006 | Buttons have descriptive aria-labels | P0 | Inspector check | ⏸️ |
| A11Y-007 | Icons hidden from screen readers | P0 | Check aria-hidden on icons | ⏸️ |
| A11Y-008 | Live regions announce dynamic changes | P0 | Test bulk action bar, filters | ⏸️ |

---

## 11. 📋 Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| QA Lead | Han | 2026-03-06 | 🔄 Pending |
| Tech Lead | Luke | - | ⏸️ |
| Product Owner | Mike | - | ⏸️ |

---

## Notes

- All P0 checkpoints must pass before launch
- Run browser automation for visual checkpoints
- Use axe-core for accessibility automated checks
- Manual testing required for keyboard/drag interactions