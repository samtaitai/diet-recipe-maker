# Implementation Plan - Enhanced Recipe Generation Validation

Enhance the recipe generation flow by validating user ingredients against diet rules and providing premium feedback.

## User Story
As a user, when I click 'Generate Recipe', I want the system to check if my ingredients match the diet rules for my selected week, so I can ensure my meal is fully compliant before generation.

## Acceptance Criteria
- [ ] Correctly resolve diet rules from `diet-rules.json`, including inheritance (e.g., "all week 1 foods").
- [ ] Perform case-insensitive matching between user ingredients and rule lists.
- [ ] Distinguish between **Prohibited** (forbidden) and **Unknown** (not in allowed list) ingredients.
- [ ] Display a premium, modal-based warning if any non-compliant ingredients are found.
- [ ] Provide clear options to "Generate Anyway" or "Cancel and Edit".
- [ ] Seamlessly proceed to generation if all ingredients are compliant.

## Technical Design

### 1. Data Logic (`src/utils/dietValidator.js`)
Create a utility to handle the complex logic of resolving rules:
- `resolveRules(dietRules, week)`: Aggregates allowed ingredients from previous weeks.
- `validateIngredients(userIngredients, rules)`: Returns an object containing `prohibited` and `unknown` lists.

### 2. Premium UI (`src/components/ValidationModal.jsx`)
A new component following the "Wellness Journal" aesthetic:
- Backdrop with blur effect.
- Clear sections for "Prohibited" (red accents) and "Not explicitly allowed" (yellow accents).
- High-contrast action buttons.

### 3. State Integration (`src/App.jsx`)
- Import validation logic and modal component.
- Add state for `showValidationModal` and `validationResults`.
- Wrap the API call in a function that first triggers validation.

## File Mappings
| File | Change Type | Description |
| --- | --- | --- |
| `src/utils/dietValidator.js` | New | Rule resolution and matching logic. |
| `src/components/ValidationModal.jsx` | New | Warning UI component. |
| `src/App.jsx` | Modify | Integrate validation into `handleGenerate` flow. |
| `src/App.css` | Modify | Add styles for modal and warning lists. |

## Dependency Order
1. **Utility**: `src/utils/dietValidator.js` (Core logic)
2. **Styles**: `src/App.css` (Visual foundation)
3. **Component**: `src/components/ValidationModal.jsx` (UI)
4. **Integration**: `src/App.jsx` (Wiring it all together)

## Testing Strategy
- **Unit Tests**: Test `dietValidator.js` with various weeks and ingredient combinations (prohibited, allowed, unknown).
- **Manual UI Testing**:
    - Enter a prohibited ingredient (e.g., "sugar" in Week 1) and verify the red warning.
    - Enter an unknown ingredient (e.g., "dragonfruit") and verify the "not explicitly allowed" warning.
    - Click "Generate Anyway" and verify the recipe is created.
    - Click "Cancel" and verify the modal closes without calling the API.

## Risks & Mitigations
- **Fuzzy Matching**: Simple string matching might miss variations (e.g., "chicken" vs "chicken breast").
    - *Mitigation*: confirmed to use `.includes()` for matching (e.g., check if a rule ingredient is included in the user's input string or vice-versa).
- **Rules File Size**: `diet-rules.json` is small and static.
    - *Mitigation*: Keep it as a direct import in the utility for simplicity and performance.
