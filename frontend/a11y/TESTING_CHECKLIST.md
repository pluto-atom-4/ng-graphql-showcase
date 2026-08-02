# Accessibility Testing Checklist
## Phase 4 - Manual Verification Guide

**Purpose:** This checklist provides step-by-step manual testing procedures for Phase 4 accessibility validation.

**Estimated Time:** 30-45 minutes  
**Tools Needed:**
- Web browser (Chrome, Firefox, Safari)
- Screen reader (VoiceOver, NVDA, or Orca)
- Keyboard only (mouse disabled)
- Browser developer tools

---

## Pre-Testing Setup

### 1. Start the Application
```bash
cd frontend
npm start
```
Application runs at `http://localhost:4200`

### 2. Run Automated Tests First
```bash
npm run test:a11y
```
**Expected:** 65+ tests passing

### 3. Open in Browser
- Chrome/Firefox recommended
- Open to `http://localhost:4200/dashboard`
- Open DevTools (F12)

### 4. Enable Accessibility Inspector
- Chrome: DevTools → Elements → Accessibility
- Firefox: Accessibility tab in DevTools
- Safari: Enable in Preferences → Advanced → Show Web Inspector menu

---

## Test Suite 1: Keyboard Navigation

### Tab Order Navigation

- [ ] **Test 1.1:** Starting at top of page, press TAB repeatedly
  - Expected: Focus moves sequentially through all interactive elements
  - Document order: Navigation → Main content → Sidebar → Footer
  - First focusable element should be visible

- [ ] **Test 1.2:** Verify skip-to-main link
  - Expected: First TAB keypress focuses skip link
  - Link text: "Skip to main content"
  - Pressing ENTER navigates to main content

- [ ] **Test 1.3:** Navigate through tabs section
  - Expected: Tab key focuses each tab button in order
  - Count: Minimum 3 tabs should be focusable
  - Currently active tab has `aria-selected="true"`

- [ ] **Test 1.4:** Navigate through button groups
  - Expected: Each button receives focus in sequence
  - Visual focus indicator visible (blue outline)
  - Minimum 4 buttons should be focusable

- [ ] **Test 1.5:** Navigate through form inputs
  - Expected: Text inputs, checkboxes, radio buttons all focusable
  - Labels clearly associated
  - Help text visible when focused

- [ ] **Test 1.6:** Reverse tab order with Shift+TAB
  - Expected: Focus moves backward through elements
  - Order reverses correctly
  - Wraps to end of page

### Arrow Key Navigation

- [ ] **Test 2.1:** Arrow Right in tabs section
  - Steps:
    1. Click on first tab to focus
    2. Press ARROW RIGHT key
  - Expected: Next tab becomes active
  - Tab content updates
  - Focus stays on tabs

- [ ] **Test 2.2:** Arrow Left in tabs section
  - Steps:
    1. Click on middle tab to focus
    2. Press ARROW LEFT key
  - Expected: Previous tab becomes active
  - Tab content updates correctly

- [ ] **Test 2.3:** Arrow Down in tabs section
  - Steps:
    1. Focus on first tab
    2. Press ARROW DOWN key
  - Expected: Next tab becomes active (alternative to arrow right)

- [ ] **Test 2.4:** Arrow Up in tabs section
  - Steps:
    1. Focus on middle tab
    2. Press ARROW UP key
  - Expected: Previous tab becomes active

- [ ] **Test 2.5:** Home key in tabs
  - Steps:
    1. Focus on any tab except first
    2. Press HOME key
  - Expected: First tab becomes active
  - Focus moves to first tab

- [ ] **Test 2.6:** End key in tabs
  - Steps:
    1. Focus on any tab except last
    2. Press END key
  - Expected: Last tab becomes active
  - Focus moves to last tab

- [ ] **Test 2.7:** Wrapping at tab boundaries
  - Steps:
    1. Focus on last tab
    2. Press ARROW RIGHT key
  - Expected: Wraps to first tab (circular navigation)

### Button Activation

- [ ] **Test 3.1:** Activate button with ENTER
  - Steps:
    1. Tab to any button
    2. Press ENTER key
  - Expected: Button activates (if clickable)
  - Associated action executes

- [ ] **Test 3.2:** Activate button with SPACE
  - Steps:
    1. Tab to any button
    2. Press SPACE key
  - Expected: Button activates
  - Same as ENTER behavior

- [ ] **Test 3.3:** Activate checkbox with SPACE
  - Steps:
    1. Tab to checkbox input
    2. Press SPACE key
  - Expected: Checkbox toggles
  - Visual state changes
  - aria-checked updates (check DevTools)

- [ ] **Test 3.4:** Activate radio button with SPACE
  - Steps:
    1. Tab to radio button
    2. Press SPACE key
  - Expected: Radio button selects
  - Related radios deselect
  - Visual state updates

### Modal/Dialog Interaction

- [ ] **Test 4.1:** Focus trap in modal
  - Steps:
    1. Open a modal/dialog
    2. Press TAB repeatedly
  - Expected: Focus stays within modal
  - Cannot tab outside dialog
  - All modal controls are reachable

- [ ] **Test 4.2:** Close modal with ESCAPE
  - Steps:
    1. Open a modal
    2. Press ESCAPE key
  - Expected: Modal closes
  - Focus returns to trigger button
  - Page content behind modal no longer focusable

- [ ] **Test 4.3:** Modal heading announced
  - Steps:
    1. Open modal
    2. Check accessibility tree in DevTools
  - Expected: Modal title/heading is first element
  - aria-labelledby points to heading
  - aria-modal="true" is set

---

## Test Suite 2: ARIA Compliance

### Landmark Regions

- [ ] **Test 5.1:** Check for main landmark
  - Steps:
    1. Open DevTools → Accessibility tab
    2. Expand document tree
  - Expected: `<main role="main">` element present
  - Only one main landmark on page

- [ ] **Test 5.2:** Check for navigation landmark
  - Expected: `<nav>` or `role="navigation"` present
  - Contains main navigation links
  - Has aria-label describing navigation purpose

- [ ] **Test 5.3:** Check for footer landmark
  - Expected: `<footer role="contentinfo">` present
  - At end of page
  - Contains copyright/site info

- [ ] **Test 5.4:** Check for complementary landmark
  - Expected: `<aside role="complementary">` present
  - Contains related but not essential content
  - Has aria-label if ambiguous

### Tab Component ARIA

- [ ] **Test 6.1:** Verify tablist role
  - Steps:
    1. Inspect tabs container in DevTools
    2. Check accessibility tree
  - Expected: `role="tablist"` on container
  - Has 3+ child elements with `role="tab"`

- [ ] **Test 6.2:** Verify tab roles
  - Expected: Each tab has `role="tab"`
  - Active tab has `aria-selected="true"`
  - Inactive tabs have `aria-selected="false"`

- [ ] **Test 6.3:** Verify aria-controls
  - Steps:
    1. Click on first tab
    2. Check attributes in DevTools
  - Expected: Tab has `aria-controls="panel-id"`
  - Referenced panel exists and is visible

- [ ] **Test 6.4:** Verify tabpanel roles
  - Expected: Each tab content has `role="tabpanel"`
  - Has `aria-labelledby` pointing to tab
  - Only active panel is visible

### Button ARIA

- [ ] **Test 7.1:** Verify button labels
  - Steps:
    1. Right-click button → Inspect
    2. Check aria-label in DevTools
  - Expected: Every button has aria-label or text content
  - Labels are descriptive
  - No "button" or "click here" labels

- [ ] **Test 7.2:** Verify button states
  - Expected: Buttons show:
    - `aria-disabled="true"` when disabled
    - `aria-busy="true"` when loading
    - Appropriate visual states match ARIA

- [ ] **Test 7.3:** Verify icon-only buttons
  - Expected: Icon buttons have aria-label
  - Label describes action, not icon name
  - Examples: "Close menu", "Save changes"

### Form Accessibility

- [ ] **Test 8.1:** Verify input labels
  - Steps:
    1. Inspect each input in DevTools
  - Expected: Each `<input>` has:
    - Associated `<label>` with matching `for` attribute, OR
    - `aria-label` attribute
  - Label text is meaningful

- [ ] **Test 8.2:** Verify help text association
  - Expected: Help text has unique `id`
  - Input has `aria-describedby="help-id"`
  - Text appears below input

- [ ] **Test 8.3:** Verify required field marking
  - Expected: Required fields have:
    - `required` HTML attribute, AND
    - `aria-required="true"` ARIA attribute
    - Visual indicator (asterisk or text)

- [ ] **Test 8.4:** Verify error states
  - Expected: Error messages have:
    - `role="alert"` or associated with input via aria-describedby
    - `aria-invalid="true"` on invalid input
    - Error text is visible and announced

### Live Regions

- [ ] **Test 9.1:** Verify status messages
  - Steps:
    1. Trigger a status update
    2. With screen reader enabled, listen
  - Expected: Message is announced
  - Has `role="status"` or `aria-live="polite"`
  - Announcement happens automatically

- [ ] **Test 9.2:** Verify error announcements
  - Expected: Errors have `role="alert"`
  - Announced immediately with `aria-live="assertive"`
  - User doesn't have to find error message

- [ ] **Test 9.3:** Verify loading states
  - Expected: Loading indicator has:
    - `aria-busy="true"`
    - Appropriate aria-label
    - Announced to screen readers

---

## Test Suite 3: Screen Reader Testing

**Note:** Pick one screen reader per session (VoiceOver, NVDA, or Orca)

### Test with VoiceOver (macOS)

- [ ] **Test 10.1:** Enable VoiceOver
  - Command: `Cmd + F5`
  - Expected: Audible confirmation tone
  - VoiceOver menu opens

- [ ] **Test 10.2:** Navigate with VO + Right Arrow
  - Expected: Each element is announced
  - Type of element (button, heading, link, etc.)
  - Button labels are clear
  - Headings are announced with level (h1, h2, etc.)

- [ ] **Test 10.3:** Use VO Rotor to jump to landmarks
  - Command: `VO + U`
  - Expected: Rotor menu appears
  - Can select "Landmarks" to jump between regions
  - Main, Navigation, Footer are listed

- [ ] **Test 10.4:** Use VO Rotor for headings
  - Command: `VO + U` → Select "Headings"
  - Expected: Can navigate by heading level
  - Heading hierarchy makes sense (h1 → h2 → h3)

- [ ] **Test 10.5:** Tab through with VO enabled
  - Command: Tab key (use VO + Left/Right for single elements)
  - Expected: Focus is announced
  - Tab order matches visual order
  - All buttons and inputs are reachable

- [ ] **Test 10.6:** Test form inputs
  - Steps:
    1. Navigate to form section
    2. Tab through inputs with VO
  - Expected: Labels are announced with inputs
  - Required status announced
  - Help text is available

- [ ] **Test 10.7:** Disable VoiceOver
  - Command: `Cmd + F5`
  - Expected: Audible confirmation tone

### Test with NVDA (Windows)

- [ ] **Test 11.1:** Start NVDA
  - Launch NVDA screen reader
  - Allow microphone/audio access
  - Expected: Welcome message announced

- [ ] **Test 11.2:** Read entire page
  - Command: `NVDA + Insert + Down` (read document)
  - Expected: All content is announced in order
  - Links, buttons, headings, form fields identified
  - No "buttons" - just "Save button", "Cancel button"

- [ ] **Test 11.3:** Navigate by landmark
  - Command: `D` (cycle through landmarks)
  - Expected: Can jump between main regions
  - Navigation, Main, Complementary, Footer announced

- [ ] **Test 11.4:** Navigate by heading
  - Command: `H` (cycle through headings)
  - Expected: Can jump by heading level
  - Hierarchy is logical

- [ ] **Test 11.5:** Tab through interactive elements
  - Command: Tab key
  - Expected: Focus order matches visual order
  - Button purposes clear
  - Form labels associated

- [ ] **Test 11.6:** Test live regions
  - Steps:
    1. Trigger a status update
    2. Listen to announcement
  - Expected: Update is announced automatically
  - No action needed from user

### Test with Orca (Linux)

- [ ] **Test 12.1:** Start Orca
  - Command: `Super + Alt + S` or application menu
  - Expected: Welcome screen and audio confirmation

- [ ] **Test 12.2:** Read page structure
  - Command: `Super + D` (read document)
  - Expected: Page content announced sequentially
  - Landmarks identified
  - Headings announced with level

- [ ] **Test 12.3:** Navigate by heading
  - Command: `H` (cycle through headings)
  - Expected: Can navigate by heading level
  - Hierarchy is logical and meaningful

- [ ] **Test 12.4:** Tab through interface
  - Command: Tab key
  - Expected: All interactive elements reachable
  - Focus order is logical
  - Labels are clear

---

## Test Suite 4: Visual Inspection

### Focus Indicators

- [ ] **Test 13.1:** Keyboard focus is visible
  - Steps:
    1. Click somewhere on page
    2. Press TAB repeatedly
  - Expected: Clear blue outline around focused element
  - Outline is 2px or larger
  - Contrast ratio meets WCAG AA (3:1)

- [ ] **Test 13.2:** Focus indicator on buttons
  - Expected: Focused button has:
    - Visible outline (blue, 2px+)
    - Distinct from hover state
    - Visible on all button types

- [ ] **Test 13.3:** Focus indicator on inputs
  - Expected: Focused input has:
    - Visible outline or border
    - Clear visual distinction
    - Text remains readable

- [ ] **Test 13.4:** Focus indicator on tabs
  - Expected: Active tab has:
    - Visual focus indicator
    - Clear visual state
    - aria-selected matches visual state

### Color and Contrast

- [ ] **Test 14.1:** Text contrast
  - Steps:
    1. Right-click text → Inspect
    2. DevTools → Computed → Check color contrast
  - Expected: Normal text has 4.5:1 ratio
  - Large text (18pt+) has 3:1 ratio

- [ ] **Test 14.2:** Button contrast
  - Expected: Button text on background has 4.5:1 ratio
  - Button border (if present) has 3:1 ratio

- [ ] **Test 14.3:** Icon contrast
  - Expected: Icons have 3:1 contrast with background
  - Icon-only buttons have visible focus indicator

- [ ] **Test 14.4:** Focus indicator contrast
  - Expected: Focus outline has 3:1 contrast with background
  - Visible against light and dark backgrounds

### Responsive Design

- [ ] **Test 15.1:** Mobile view (320px)
  - Steps:
    1. Open DevTools
    2. Device toolbar → iPhone SE (375px)
  - Expected: Content reflows
  - Touch targets ≥ 44x44 pixels
  - Buttons remain clickable

- [ ] **Test 15.2:** Tablet view (768px)
  - Expected: Layout adapts to tablet
  - Two-column layouts may stack
  - Touch targets ≥ 44x44 pixels

- [ ] **Test 15.3:** Zoom to 200%
  - Steps:
    1. Ctrl/Cmd + Plus (zoom to 200%)
  - Expected: Content remains readable
  - No horizontal scrolling
  - All content visible
  - Text doesn't become tiny

- [ ] **Test 15.4:** Keyboard at all sizes
  - Expected: TAB navigation works at all zoom levels
  - Focus indicator visible on mobile
  - Tab order logical even in mobile view

---

## Test Suite 5: Automated Tools

### Run Lighthouse Audit

```bash
# Start app if not running
npm start &

# Run Lighthouse
npm run audit:lighthouse

# View report
open frontend/a11y/reports/baseline-lighthouse.json
```

- [ ] **Test 16.1:** Lighthouse accessibility score
  - Expected: Score ≥ 90
  - All critical issues resolved
  - Warnings reviewed

- [ ] **Test 16.2:** Lighthouse best practices
  - Expected: Score ≥ 90
  - All ARIA issues fixed
  - No contrast violations

### Run Pa11y Audit

```bash
# Make sure app is running on localhost:4200
npm run audit:pa11y
```

- [ ] **Test 17.1:** Pa11y passes WCAG 2AA
  - Expected: No critical issues
  - All URLs scan successfully
  - No ARIA errors

### Run Unit Tests

```bash
npm run test:a11y
```

- [ ] **Test 18.1:** Keyboard navigation tests pass
  - Expected: 42 tests passing
  - No skipped tests
  - No warnings

- [ ] **Test 18.2:** ARIA compliance tests pass
  - Expected: 23 tests passing
  - All attributes verified
  - No test failures

---

## Sign-Off

### Checklist Completion

- [ ] All tests in Suite 1 (Keyboard Navigation): ✓ Passed
- [ ] All tests in Suite 2 (ARIA Compliance): ✓ Passed
- [ ] All tests in Suite 3 (Screen Reader): ✓ Passed
- [ ] All tests in Suite 4 (Visual): ✓ Passed
- [ ] All tests in Suite 5 (Automated): ✓ Passed

### Summary

**Total Tests:** 60+ (manual + automated)  
**Expected Pass Rate:** 100%  
**Compliance Level:** WCAG 2.1 AA  

### Issues Found

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | (Example) Button label unclear | Medium | ✓ Fixed |
| 2 | (Example) Focus outline too subtle | High | ✓ Fixed |
| 3 | (Example) Form label missing | High | ✓ Fixed |

### Approval

- **Manual Testing:** _______________  Date: ___________
- **Code Review:** _______________  Date: ___________
- **Accessibility Lead:** _______________  Date: ___________

---

## Resources

### Browser Tools
- Chrome DevTools Accessibility: [https://developer.chrome.com/docs/devtools/accessibility/reference/](https://developer.chrome.com/docs/devtools/accessibility/reference/)
- Firefox Accessibility Inspector: [https://firefox-source-docs.mozilla.org/devtools-user/accessibility_inspector/](https://firefox-source-docs.mozilla.org/devtools-user/accessibility_inspector/)

### Screen Readers
- VoiceOver: [https://www.apple.com/accessibility/voiceover/](https://www.apple.com/accessibility/voiceover/)
- NVDA: [https://www.nvaccess.org/](https://www.nvaccess.org/)
- Orca: [https://help.gnome.org/users/orca/stable/](https://help.gnome.org/users/orca/stable/)

### WCAG Guidelines
- WCAG 2.1: [https://www.w3.org/WAI/WCAG21/quickref/](https://www.w3.org/WAI/WCAG21/quickref/)
- ARIA Patterns: [https://www.w3.org/WAI/ARIA/apg/](https://www.w3.org/WAI/ARIA/apg/)
- WebAIM: [https://webaim.org/](https://webaim.org/)

---

**Checklist Version:** 1.0  
**Last Updated:** 2026-08-01  
**Phase:** 4 Complete
