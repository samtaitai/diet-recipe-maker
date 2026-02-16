# Implementation Strategy

## Guiding Principles

1. **Data layer first** — UI is meaningless without the backend and data models working correctly.
2. **Auth-gated features depend on auth** — ingredients list and favourites require a logged-in user. Auth already works, so we build on it.
3. **Each phase delivers a usable increment** — the app should be functional (not broken) at the end of every phase.
4. **Global database before personal data** — users need ingredients to exist before they can add them to their list.

---

## Phase 1: Premium Ingredient UI & Persistence (US-1, US-7)

**What:** Build the high-end tag-based entry system and persist list to profile.

**Why first:**
- Establishes the "Wellness Journal" design language (typography, palette).
- The tag system is the primary interaction point.

**Work:**
- Frontend: Setup typography (Serif for headers, Sans for tags).
- Frontend: Implement `TagInput` with comma-separation logic.
- Frontend: Create the rotating "Wellness Hint" bubble.
- Backend: Update `users/{uid}` to store `ingredient_list`.
- Firestore security rules.

---

## Phase 2: Enhanced Recipe Generation (US-1, US-4)

**What:** Refactor `generateRecipe` with rich metadata (macros, wellness tips).

**Why second:**
- Connects the premium UI with rich, generated content.
- Adds the unique "Switch-On" wellness layer.

**Work:**
- Backend: Update AI prompt for structured JSON (Health Benefits, Nutrition, Wellness Tips).
- Frontend: Create centered `RecipeCard` with Serif titles and circular instruction badges.
- Frontend: Implement the four macro-nutrition cards.
- Frontend: Full-screen loading overlay with smooth animations.


---

## Phase 4: Favourites (US-6)

**What:** Save/list/delete favourite recipes.

**Why fourth:**
- Users need to generate recipes before they can save them.
- Independent of Phase 3, but follows Phase 2.

**Work:**
- Backend: updated endpoints for `users/{uid}/favorites` sub-collection.
- Frontend: "Save" button on RecipeDisplay and Favourites list/sidebar.
- Firestore security rules for the favorites sub-collection.

---

## Phase 5: PDF Export Refinement (US-8)

**What:** Improve the existing PDF export to be truly print-friendly.

**Why last:**
- Formatting pass with no functional dependencies.

**Work:**
- Redesign `PrintView` component with clean print typography.
- Structured sections: title, ingredients table, numbered instructions, macros summary.
- Proper A4 page breaks and header information (diet week, date).

---

## Phase Summary

| Phase | User Stories | Depends On | Effort |
|-------|-------------|-----------|--------|
| 1. Manual Entry & Persistence | US-1, US-7 | Nothing | Medium |
| 2. Recipe Gen Refactor | US-1, US-4 | Phase 1 | Small |
| 3. Favourites | US-6 | Phase 2 | Medium |
| 4. PDF Polish | US-8 | Phase 2 | Small |

## Parallelization

- **Phase 3 (Favourites)** can be built in parallel with other features once Phase 2 is stable.
- **Phase 5 (PDF)** can happen anytime after Phase 2 is stable.
- **Firestore security rules** should be updated as each collection/structure is introduced.
