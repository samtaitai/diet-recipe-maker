# Technical Design Document: Switch-On Diet Recipe Generator

> **MEMO TO IDE AGENT:**
> * **LLM Provider:** Using **Google AI Studio (Gemini Developer API)** instead of Vertex AI.
> * **API Key:** The Gemini API Key should be stored as a Firebase Secret or environment variable (`GOOGLE_API_KEY`).
> * **Firebase/Firestore:** Use the existing `switchon-recipe-maker-2aecb8837fec.json` service account ONLY for Firestore and Firebase Admin tasks.
> * **Library:** Use `google-generativeai` for AI calls in the Python functions.

---

## 1. Project Overview
A premium, web-based AI recipe generator tailored to the "Switch-On Diet" 4-week program. The system uses a "wellness journal" aesthetic and Retrieval-Augmented Generation (RAG) to ensure recipes comply with specific weekly restrictions. Users provide main groceries via a modern tag-based interface, generate diet-compliant recipes with detailed nutritional cards and wellness tips, and manage their favorites—all persisted to their account with a high-end, responsive design.

---

## 2. User Stories

### US-1: Generate recipe from my ingredient list (changed)
As a user, I want a modern, tag-based input field where I can enter ingredients manually (comma-separated), so that the system can suggest a recipe based on those main ingredients.

### US-4: Generate recipe based on diet rules
As a user, I want the system to create a recipe based on the pre-defined diet rule for my selected week, so that my meals comply with the Switch-On Diet program.


### US-6: Save favourite recipes (authenticated)
As a user, I want to save my favourite recipes when I am logged in, so that I can revisit them later.

### US-7: Persist my ingredient list (authenticated)
As a user, I want the system to save my current ingredient list when I am logged in, so it is available next time I return.

### US-8: Export recipe as print-friendly PDF
As a user, I want to publish each recipe as a PDF in a print-friendly format, so I can print or share it offline.

### US-9: "Chef, up to you" Recipe Generation
As a user, I want the system to create a recipe entirely based on the pre-defined allowed ingredient for my selected week, without any entry for ingredient list. I want an extra button called 'Chef, up to you' next to the current 'generate recipe'. Two button have different emoji and button color.

### US-10: Recommended Ingredients Inspiration
As a user, I want a "Need inspiration?" button below the ingredient input that opens a modal with categorized recommended ingredients (Proteins, Vegetables, Grains, Healthy Fats, Flavour Boosters). Clicking any ingredient adds it directly to my list, making it easier to build a diet-compliant recipe.

### US-11: Refined Sticky Header & User Profile
As a user, I want a sticky header that remains at the top of the page. Before signing in, it should show a bordered "Sign in" button. After signing in, it should show a circular avatar with initials. Clicking this avatar should open a menu with "Sign out" and "Favourite" options. "Favourite" should navigate to the favourites section on the page. The application name should have proper spacing.

---

## 3. Tech Stack
* **Frontend:** React (v18+) + Vite, hosted on Firebase Hosting.
* **Backend:** Firebase Functions (Python 3.11+).
* **AI:** Google AI Studio (Gemini 2.5 Pro).
* **Database:** Cloud Firestore.
* **Auth:** Firebase Authentication (Google SSO).
* **Libraries:** `jsPDF` (PDF Export), `i18next` (Internationalization), `firebase-admin` (Python SDK).

---

## 4. Data Models (Firestore)

### Collection: `diet_rules`
* **Doc ID:** `week_1`, `week_2`, `week_3`, `week_4`
* **Fields:**
    * `allowed_ingredients`: `array<string>`
    * `forbidden_ingredients`: `array<string>`
    * `rules_text`: `string` (Detailed logic for the AI prompt)

### Collection: `users`
* **Doc ID:** `uid` (Firebase Auth UID)
* **Fields:**
    * `email`: `string`
    * `last_request_timestamp`: `timestamp`
    * `ingredient_list`: `array<string>` (US-1, US-7: Persisted manual entry list)

### Sub-collection: `users/{uid}/favorites` (US-6)
* **Doc ID:** auto-generated
* **Fields:**
    * `recipe_title`: `string`
    * `recipe_content`: `map` (Structured JSON: title, description/health_benefit, nutrition_macros, ingredients_list, instructions_list, wellness_tip)
    * `week`: `number`
    * `created_at`: `timestamp`

---

## 5. System Logic & RAG Workflow

### `generateRecipe` (Cloud Function — US-1, US-4)
1.  **Auth:** Verify Firebase ID token.
2.  **Rate Limit Check:** Fetch `users/{uid}`. If `now - last_request_timestamp < 10s`, return `429 Too Many Requests`.
3.  **Input:** Accepts `manual_ingredients` (list of strings) and `week`.
4.  **Retrieval — Diet Rules:** Fetch `diet_rules/week_{n}` from Firestore.
5.  **Augmentation:** Construct System Instruction. Request a sophisticated output including:
    *   Title and "Health Benefit" subtitle.
    *   Prep/Cook/Servings metadata.
    *   Nutrition Macros (Calories, Protein, Carbs, Fat).
    *   Ingredients and Numbered Instructions.
    *   A custom **"Wellness Tip"** specific to the Switch-On phase.
6.  **Generation:** Call Gemini. Request JSON output.
7.  **Update:** Set `last_request_timestamp` to `now`. If authenticated, update `users/{uid}.ingredient_list`.


### Favorites CRUD (US-6)
* **Save:** Authenticated user saves a recipe to `users/{uid}/favorites`.
* **List/Delete:** Manage favorites within the user's sub-collection.

### Ingredient List Persistence (US-7)
* The manual list is stored in the `users/{uid}` document or a simple sub-collection.
* On login, the frontend loads this list into the prompt.

---

## 6. Frontend Requirements

### Ingredient Entry (US-1, US-7)
* **Modern Tag Input:** A centered, premium input field that converts comma-separated text into interactive tags with "x" buttons.
* **Helpful Guidance:** A rotating "Wellness Hint" bubble appearing above the input to guide ingredient pairings.
* **Persistence:** If logged in, the system automatically saves and loads the tag list.

* **Visibility:** The "Generate Recipe" button is only visible when authenticated (as it requires a saved ingredient list). The "Chef, up to you" button is available to all users.
* **UX Flow:** Minimalist full-screen loading overlay with smooth animations.
* **Presentation (Wellness Journal Style):** 
    *   Use a sophisticated mix of **Serif typography** for titles and clean Sans-serif for data/instructions.
    *   **Nutrition Cards:** Four colorful, distinct cards showing macro distribution (Calories, Protein, Carbs, Fat).
    *   **Instruction Badges:** Numbered steps with circular badge styling.
    *   **Wellness Tip Section:** A dedicated block at the bottom for diet-specific advice.


### Favourites (US-6)
* **Styling:** Floating "Favourite" button on the recipe card.

### PDF Export (US-8)
* **Layout:** Mirror the "Wellness Journal" aesthetic with clean typography and high-contrast sections.

### General Aesthetics
* **Palette:** Calm, neutral background (off-white/beige) with charcoal text and vibrant nutrition accents.
* **Feel:** Breathing room (large padding/margins), rounded corners, and smooth transitions.
* **Typography:** Premium Serif (e.g., Playfair Display or Merriweather) for headers.

### General Technical
* **Internationalization (i18n):** Support for English (`en.json`) and Korean (`ko.json`).
* **Social Sharing:** Twitter Web Intent integration, accessible only to authenticated users (with alert for guests).
* **Auth:** Google SSO button using the `firebase/auth` SDK.

---

## 7. Security & Rules
### App Check
* **Implementation**: Firebase App Check with reCAPTCHA v3.
* **Goal**: Protect backend resources (Cloud Functions) from abuse, such as unauthenticated requests to the Gemini API via "Chef, up to you".
* **Enforcement**:
    *   **Frontend**: Initialized in `services/firebase.js` using `VITE_RECAPTCHA_SITE_KEY`.
    *   **API**: Token passed in `X-Firebase-App-Check` header for custom fetch calls.
    *   **Backend**: Verified in `functions/main.py` using `firebase-admin` SDK.

### Firestore Security Rules
* `diet_rules`: Read-only for authenticated users.
* `users/{uid}`: Read/write only by the owning user.
* `users/{uid}/favorites`: Read/write only by the owning user.

---

## 8. Development & DevOps
* **Local Testing:** Use Firebase Emulators. Set `GOOGLE_APPLICATION_CREDENTIALS` to the `switchon-recipe-maker-2aecb8837fec.json` file at the root.
* **Testing:**
    * `pytest` for backend function logic.
    * `Playwright` for E2E user flows.
* **CI/CD:** GitHub Actions configured to run tests and execute `firebase deploy`.