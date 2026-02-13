# Technical Design Document: Switch-On Diet Recipe Generator

> **MEMO TO IDE AGENT:**
> * **LLM Provider:** Using **Google AI Studio (Gemini Developer API)** instead of Vertex AI.
> * **API Key:** The Gemini API Key should be stored as a Firebase Secret or environment variable (`GOOGLE_API_KEY`).
> * **Firebase/Firestore:** Use the existing `switchon-recipe-maker-2aecb8837fec.json` service account ONLY for Firestore and Firebase Admin tasks.
> * **Library:** Use `google-generativeai` for AI calls in the Python functions.

---

## 1. Project Overview
A web-based AI recipe generator tailored to the "Switch-On Diet" 4-week program. The system uses Retrieval-Augmented Generation (RAG) to ensure recipes comply with specific weekly restrictions (allowed/forbidden foods). Users manage a personal ingredient inventory, generate diet-compliant recipes from those ingredients, identify missing items for a shopping list, and save favourite recipes — all persisted to their account.

---

## 2. User Stories

### US-1: Generate recipe from my ingredient list
As a user, I want the system to create a recipe based on the list of groceries that I have, so that I can cook with what's available.

### US-2: Search and add ingredients to my ingredient list
As a user, I want to add or update groceries in my personal "ingredient list" by searching ingredient names (e.g. "cabbage") in the system, so that I can maintain an up-to-date inventory.

### US-3: Add or update ingredients in the search database
As a user, I want to add or update an ingredient in the search database of ingredients, so that new or custom items are available for all users to find.

### US-3a: Edit ingredient details
As a user, I want to edit an ingredient's name, Korean name, category, or any combination of these fields, so that I can correct or improve ingredient information.

### US-3b: "Add new ingredient" as a button
As a user, I want "Add new ingredient" to appear as a styled button (not a hypertext link), so that the action is clearly visible and consistent with the rest of the UI.

### US-4: Generate recipe based on diet rules
As a user, I want the system to create a recipe based on the pre-defined diet rule for my selected week, so that my meals comply with the Switch-On Diet program.

### US-5: Shopping list from recipe vs. ingredient list
As a user, I want the system to look up my current ingredient list, compare it against the recipe it created, and show me a list of groceries I need to shop for, so I know exactly what to buy.

### US-6: Save favourite recipes (authenticated)
As a user, I want to save my favourite recipes when I am logged in, so that I can revisit them later.

### US-7: Persist my ingredient list (authenticated)
As a user, I want the system to save my current ingredient list when I am logged in, so it is available next time I return.

### US-8: Export recipe as print-friendly PDF
As a user, I want to publish each recipe as a PDF in a print-friendly format, so I can print or share it offline.

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

### Collection: `ingredients` (Global ingredient database — US-2, US-3)
* **Doc ID:** auto-generated
* **Fields:**
    * `name`: `string` (Canonical ingredient name, e.g. "cabbage")
    * `name_ko`: `string` (Korean name for i18n)
    * `category`: `string` (e.g. "vegetable", "protein", "dairy", "grain", "spice")
    * `created_by`: `string` (UID of user who added it, or "system")
    * `created_at`: `timestamp`

### Collection: `users`
* **Doc ID:** `uid` (Firebase Auth UID)
* **Fields:**
    * `email`: `string`
    * `last_request_timestamp`: `timestamp` (For 10-second cooldown rate-limiting)

### Sub-collection: `users/{uid}/ingredient_list` (Personal ingredient inventory — US-2, US-7)
* **Doc ID:** ingredient doc ID (reference to `ingredients` collection)
* **Fields:**
    * `name`: `string` (Denormalized ingredient name for quick reads)
    * `quantity`: `string` (Optional, e.g. "500g", "2 heads")
    * `added_at`: `timestamp`
    * `updated_at`: `timestamp`

### Collection: `favorites` (US-6)
* **Doc ID:** auto-generated
* **Fields:**
    * `userId`: `string` (Index)
    * `recipe_title`: `string`
    * `recipe_content`: `map` (Structured JSON from AI — ingredients, instructions, macros)
    * `week`: `number` (Which diet week this recipe was generated for)
    * `created_at`: `timestamp`

---

## 5. System Logic & RAG Workflow

### `generateRecipe` (Cloud Function — US-1, US-4)
1.  **Auth:** Verify Firebase ID token.
2.  **Rate Limit Check:** Fetch `users/{uid}`. If `now - last_request_timestamp < 10s`, return `429 Too Many Requests`.
3.  **Retrieval — Ingredients:** Fetch the user's `users/{uid}/ingredient_list` sub-collection to get available ingredients. (US-1)
4.  **Retrieval — Diet Rules:** Fetch `diet_rules/week_{n}` document from Firestore. (US-4)
5.  **Augmentation:** Construct a System Instruction:
    * "You are a nutritional expert for the Switch-On Diet. Rules for Week {n}: {rules_text}. Use ONLY from these allowed categories: {allowed_ingredients}. The user has these ingredients on hand: {user_ingredient_list}. Strictly avoid: {forbidden_ingredients}."
6.  **Generation:** Call Google AI Studio Gemini 2.5 Pro via the Python SDK. Request JSON output including `ingredients` list with quantities.
7.  **Update:** Set `last_request_timestamp` to `now` in Firestore.

### `getShoppingList` (Cloud Function — US-5)
1.  **Auth:** Verify Firebase ID token.
2.  **Input:** Accept `recipe_ingredients` (list of ingredient names/quantities from a generated recipe).
3.  **Retrieval:** Fetch the user's `users/{uid}/ingredient_list`.
4.  **Comparison:** Diff recipe ingredients against user's ingredient list.
5.  **Response:** Return `{ "have": [...], "need_to_buy": [...] }`.

### Ingredient Search (US-2)
* Query the `ingredients` collection with a prefix/substring match on `name` field.
* Return matching ingredients for the user to add to their personal list.

### Ingredient CRUD (US-3, US-3a)
* Authenticated users can add new ingredients to the global `ingredients` collection.
* Users can edit an ingredient's name, Korean name, category, or any combination of these fields (US-3a).
* Only the original creator or system ingredients may be edited.
* Deduplication: check for existing ingredient by name before creating.

### Favorites CRUD (US-6)
* **Save:** Authenticated user saves a recipe to `favorites` with their UID.
* **List:** Fetch all `favorites` where `userId == uid`, ordered by `created_at` desc.
* **Delete:** User can remove a favourite by doc ID.

### Ingredient List Persistence (US-7)
* The user's ingredient list is stored in `users/{uid}/ingredient_list` sub-collection.
* All add/update/remove operations are persisted immediately.
* On login, the frontend loads the user's ingredient list from Firestore.

---

## 6. Frontend Requirements

### Ingredient Management (US-2, US-3, US-7)
* **Ingredient Search:** Autocomplete/search input that queries the global `ingredients` collection.
* **Add to My List:** User selects an ingredient from search results to add it to their personal list with optional quantity.
* **My Ingredient List:** Displays the user's current ingredients with ability to update quantity or remove items.
* **Edit Ingredient:** Users can edit an ingredient's name, Korean name, and/or category inline from search results (US-3a).
* **Add New Ingredient:** If search yields no results, a styled button (not a hypertext link) allows the user to create a new ingredient in the global database (US-3b).

### Recipe Generation (US-1, US-4)
* **Form:** Dropdown for "Week" (1-4). The ingredient input is replaced by the user's persisted ingredient list.
* **Generate Button:** Triggers recipe generation using the user's ingredient list + selected week's diet rules.

### Shopping List (US-5)
* **Display:** After a recipe is generated, a "What do I need to buy?" button/section.
* **List View:** Shows ingredients split into "Already have" and "Need to buy" groups.

### Favourites (US-6)
* **Save Button:** On the recipe display, a button to save the recipe to favourites (authenticated only).
* **Favourites Page/Section:** Lists saved recipes with ability to view details or delete.

### PDF Export (US-8)
* Implement a hidden `PrintView` component.
* Use `jsPDF` to generate the PDF client-side by capturing the PrintView.
* Print-friendly layout: clean typography, structured sections (title, ingredients, instructions, macros).

### General
* **Internationalization (i18n):** Support for English (`en.json`) and Korean (`ko.json`).
* **Social Sharing:** Twitter Web Intent integration.
* **Auth:** Google SSO button using the `firebase/auth` SDK.

---

## 7. Firestore Security Rules
* `diet_rules`: Read-only for authenticated users. Write denied (admin-only via service account).
* `ingredients`: Read for authenticated users. Create for authenticated users. Update only by the original creator or admin.
* `users/{uid}`: Read/write only by the owning user (`request.auth.uid == uid`).
* `users/{uid}/ingredient_list`: Read/write only by the owning user.
* `favorites`: Read/write only where `userId == request.auth.uid`.

---

## 8. Development & DevOps
* **Local Testing:** Use Firebase Emulators. Set `GOOGLE_APPLICATION_CREDENTIALS` to the `switchon-recipe-maker-2aecb8837fec.json` file at the root.
* **Testing:**
    * `pytest` for backend function logic.
    * `Playwright` for E2E user flows.
* **CI/CD:** GitHub Actions configured to run tests and execute `firebase deploy`.