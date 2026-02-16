## Development Workflow Preferences

- After completing each implementation phase or user story, provide a status summary including:
  - What was just completed based on TDD.md and IMPLEMENTATION_STRATEGY.md
  - What's next based on TDD.md and IMPLEMENTATION_STRATEGY.md
  - Any blockers or decisions needed
- Commit messages: single line, concise. No verbose multi-line descriptions.

## Knowledge Base & Technical Lessons

### 1. The "Two-Click" Save Button Issue (UI Stability)
- **Problem**: First click on a "Save" button fails if it sits next to a focused input.
- **Cause**: The `blur` event on the input causes a layout shift (due to transitions, focus shadows, or padding), making the browser cancel the `click` event.
- **Solution**: 
  - Use `onMouseDown` for critical buttons (it fires before `blur`).
  - Use `e.preventDefault()` in `onMouseDown` to maintain focus stability.
  - Disable `transition` and `box-shadow` on focus for elements in high-density areas.
  - See `lesson.md` for the full technical breakdown.
