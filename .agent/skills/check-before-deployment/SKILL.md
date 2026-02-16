---
name: Check Before Deployment
description: A procedure to review the codebase for unused code, unnecessary complexity, and overall integrity before deployment.
---

# Check Before Deployment Skill

This skill outlines the process for conducting a final code review and cleanup before a major release or deployment. It ensures the codebase is lean, consistent, and free of "ghost code" from old features.

## 1. Codebase Size & Organization Review

- **Check Large Files**: Identify any files exceeding ~300 lines (e.g., `App.jsx`, `main.py`, `App.css`).
    - *Action*: If a file is too large, consider splitting it into smaller modules or components.
    - *Action*: For CSS, consider extracting component-specific styles or using CSS modules.
- **Check Directory Structure**: Ensure files are logically grouped (e.g., `components/`, `services/`, `utils/`).

## 2. Prune Unused Code & Dependencies

- **Review `package.json`**:
    - *Action*: Check for dependencies listed in `dependencies` or `devDependencies` that are not imported anywhere in the project. Remove them.
- **Review React Components (`src/components/`, `src/App.jsx`)**:
    - *Action*: Look for unused `useState`, `useEffect`, `useRef`, or other hooks. Remove them.
    - *Action*: Remove unused imports.
    - *Action*: Simplify components where possible (e.g., remove `forwardRef` if the ref is not used).
- **Review Service Files (`src/services/`)**:
    - *Action*: Ensure all exported API functions are actually used in the application. Remove dead code.
- **Review Backend Functions (`functions/main.py`)**:
    - *Action*: Verify all cloud functions have a corresponding frontend usage or purpose. Remove deprecated endpoints.

## 3. Verify Against Requirements

- **Check `TDD.md` (or equivalent design doc)**:
    - *Action*: Ensure all active User Stories have a corresponding implementation.
    - *Action*: crucially, ensure code related to **discarded** User Stories has been fully removed.

## 4. Security & Critical Issue Check

- **API Security**:
    - *Action*: Verify that sensitive endpoints (e.g., `save_favorite`) require authentication (`verify_auth`).
    - *Action*: Check if unauthenticated endpoints (e.g., `generate_recipe`) have proper rate limiting to prevent abuse. Ensure rate limiting cannot be bypassed by simply not sending an auth token.
- **Data Consistency**:
    - *Action*: Check for duplicated logic or data sources between frontend and backend (e.g., diet rules in `json` vs Firestore). Ensure they are synchronized or single-sourced.
- **Secrets Management**:
    - *Action*: Scan code for hardcoded API keys or credentials.
    - *Action*: Verify `.gitignore` includes local environment files (e.g., `.env`, service account JSONs).

## 5. Build & Lint Verification

- **Run Build**:
    - `npm run build` (or equivalent)
    - *Action*: Fix any build errors immediately.
- **Run Lint**:
    - `npm run lint` (if configured)
    - *Action*: Address warnings and errors.
- **Verify Backend Deployment (Optional)**:
    - If using Firebase/Cloud Functions, ensure `firebase deploy` (or dry run) succeeds.

## 6. Final Integrity Check

- **Console Logs**: Remove temporary `console.log` statements used for debugging.
- **Comments**: Remove commented-out blocks of code.
- **TODOs**: Review any `TODO` comments. Address them or ticket them for later.
