# L003: Bulk Actions UI Design - UX Specification
**Agent:** Leia (Design/UX) | **Status:** ✅ Complete

## Selection Pattern
- Shadcn `Checkbox` for individual + select all
- Selected row: `bg-blue-50/50 hover:bg-blue-100` + `border-l-4 border-blue-500`
- Shift-click for range select (desktop), tap-to-select (mobile)
- Select All: checked/unchecked/indeterminate states

## Action Bar
- Fixed bottom on mobile, sticky on desktop
- Shows: selected count + Delete + Schedule + Status Change + Deselect All
- Uses `Button` variants, `DropdownMenu` for status, `Popover` for date picker
- `aria-live="polite"` for screen reader announcements

## Confirmation Dialogs
- Shadcn `AlertDialog` for destructive actions
- Focus initially on Cancel to prevent accidents
- Clear action labels ("Delete 5 posts" not "Yes")

## Visual Feedback
- Selected: `bg-blue-50/50`, `border-l-4 border-blue-500`
- Hover: `hover:bg-gray-50`
- Loading: disabled buttons with spinner during processing
- Toast notifications for success/failure

## Mobile
- Action bar `fixed bottom-0`
- Large touch targets
- No shift-click; tap-to-select only
- Stacked buttons if needed

## Accessibility
- All checkboxes with aria-labels
- Keyboard: Tab to focus, Space to toggle
- Focus rings on all interactive elements
- WCAG color contrast compliance
