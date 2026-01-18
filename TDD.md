# Technical Design Document: Switch-On Diet Recipe Generator

> **MEMO TO IDE AGENT:**
> * **LLM Provider:** Using **Google AI Studio (Gemini Developer API)** instead of Vertex AI. 
> * **API Key:** The Gemini API Key should be stored as a Firebase Secret or environment variable (`GOOGLE_API_KEY`).
> * **Firebase/Firestore:** Use the existing `switchon-recipe-maker-2aecb8837fec.json` service account ONLY for Firestore and Firebase Admin tasks.
> * **Library:** Use `google-generativeai` for AI calls in the Python functions.

---

## 1. Project Overview
A web-based AI recipe generator tailored to the "Switch-On Diet" 4-week program. The system uses Retrieval-Augmented Generation (RAG) to ensure recipes comply with specific weekly restrictions (allowed/forbidden foods). 

## 2. Tech Stack
* **Frontend:** React (v18+) + Vite, hosted on Firebase Hosting.
* **Backend:** Firebase Functions (Python 3.11+).
* **AI:** Google Vertex AI (Gemini 2.0 Flash).
* **Database:** Cloud Firestore.
* **Auth:** Firebase Authentication (Google SSO).
* **Libraries:** `jsPDF` (PDF Export), `i18next` (Internationalization), `firebase-admin` (Python SDK).

---

## 3. Data Models (Firestore)

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
    * `last_request_timestamp`: `timestamp` (For 10-second cooldown rate-limiting)

### Collection: `favorites`
* **Fields:** * `userId`: `string` (Index)
    * `recipe_title`: `string`
    * `recipe_content`: `map` (Structured JSON from AI)
    * `created_at`: `timestamp`

---

## 4. System Logic & RAG Workflow

### `generateRecipe` (Cloud Function)
1.  **Rate Limit Check:** Fetch `users/{uid}`. If `now - last_request_timestamp < 10s`, return `429 Too Many Requests`.
2.  **Retrieval:** Fetch `diet_rules/week_{n}` document from Firestore.
3.  **Augmentation:** Construct a System Instruction:
    * "You are a nutritional expert for the Switch-On Diet. Rules for Week {n}: {rules_text}. Use ONLY: {allowed_ingredients}. Strictly avoid: {forbidden_ingredients}."
4.  **Generation:** Call Vertex AI Gemini 2.0 Flash via the Python SDK. Request JSON output.
5.  **Update:** Set `last_request_timestamp` to `now` in Firestore.

---

## 5. Frontend Requirements
* **Form:** Dropdown for "Week" (1-4) and a multi-input text field for "Available Ingredients."
* **Internationalization (i18n):** Support for English (`en.json`) and Korean (`ko.json`).
* **PDF Export:** * Implement a hidden `PrintView` component.
    * Use `jsPDF` to generate the PDF client-side by capturing the PrintView.
* **Social Sharing:** Twitter Web Intent integration.
* **Auth:** Google SSO button using the `firebase/auth` SDK.

---

## 6. Development & DevOps
* **Local Testing:** Use Firebase Emulators. Set `GOOGLE_APPLICATION_CREDENTIALS` to the `switchon-recipe-maker-2aecb8837fec.json` file at the root.
* **Testing:** * `pytest` for backend function logic.
    * `Playwright` for E2E user flows.
* **CI/CD:** GitHub Actions configured to run tests and execute `firebase deploy`.