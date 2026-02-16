---
name: implement-plan
description: "Execute code changes based on a structured implementation plan. Reads a plan markdown file with user story, acceptance criteria, file mappings, dependency order, testing strategy, and risks — then implements the feature phase by phase."
---

You are implementing a software feature from a structured implementation plan document. Follow these steps precisely.

## Step 1: Locate the Plan

Ask the user which implementation plan file to use. Use the Glob tool to search for markdown files that could be plans (e.g., `**/*plan*.md`, `**/*implementation*.md`, `docs/plans/**/*.md`). Present the matches and ask the user to confirm which file to use.

## Step 2: Parse the Plan

Read the selected plan file. It follows this 7-section structure — extract each section:

1. **User Story Summary** — Story statement, tech stack, total effort estimate, priority
2. **Acceptance Criteria** — Checklist items formatted as `- [ ] AC-N: [Description]`
3. **File & Component Mapping** — Table of tasks → file paths → architectural layer (Backend/Frontend/DB/Config)
4. **Dependencies & Implementation Order** — Mermaid diagram + phased order (Foundation → Core Logic → Integration & Polish)
5. **Testing Strategy** — Table of tasks → test types (Unit/Integration/E2E) + key scenarios
6. **Risk Assessment** — Table of risks, likelihood, impact, mitigation strategies
7. **Notes & Assumptions** — Assumptions, open questions, external dependencies

If any section is missing or malformed, warn the user and ask how to proceed.

## Step 3: Review and Confirm

Before writing any code, present the user with a summary:
- Total files to create or modify (from Section 3)
- Implementation phases and order (from Section 4)
- Key risks to watch for (from Section 6)
- Any open questions or assumptions that need resolution (from Section 7)

Ask the user to confirm before proceeding. If there are open questions in Section 7, resolve them with the user first.

## Step 4: Set Up Progress Tracking

Create a TodoWrite checklist that includes:
- One item per implementation phase from Section 4
- One item per acceptance criterion from Section 2
- A final "Run tests and verify all acceptance criteria" item

Mark items in_progress and completed as you work through them.

## Step 5: Implement Phase by Phase

Follow the dependency/implementation order from Section 4 strictly. For each phase:

### 5a. Pre-Implementation
- Read all existing files listed in Section 3 for this phase before making changes
- Identify the architectural layer (Backend/Frontend/DB/Config) to apply appropriate patterns
- Review the risk mitigations from Section 6 that apply to this phase

### 5b. Write Code
- Create or modify files exactly as specified in the File & Component Mapping (Section 3)
- Follow the project's existing code style and conventions (inspect neighboring files if needed)
- Add inline comments for non-obvious logic
- Handle edge cases and error scenarios identified in Section 5

### 5c. Write Tests
- For each file changed, write tests matching the Testing Strategy (Section 5)
- Cover the specific scenarios listed: happy path, edge cases, error handling
- Place test files in the project's conventional test directory structure
- Run tests after writing them to confirm they pass

### 5d. Phase Checkpoint
- After completing each phase, update the TodoWrite checklist
- Verify that no acceptance criteria from Section 2 that should be met by this phase are failing
- If a risk from Section 6 materializes, apply the documented mitigation strategy and inform the user

## Step 6: Integration Verification

After all phases are complete:
- Run the full test suite to check for regressions
- Walk through every acceptance criterion from Section 2 one by one:
  - If verifiable by running code or tests, do so and report the result
  - If requiring manual verification, note it for the user
- Update the plan file: check off completed acceptance criteria (`- [x] AC-N: ...`)

## Step 7: Final Report

Present the user with a completion summary:
- List of all files created or modified
- Acceptance criteria status (passed / needs-manual-check / failed)
- Any risks that materialized and how they were handled
- Any deviations from the original plan and why
- Remaining items that need manual verification or follow-up

## Constraints

- Never skip a phase or reorder dependencies unless the user explicitly approves
- If you encounter an ambiguity not covered by the plan, stop and ask the user rather than guessing
- Prefer small, incremental commits of working code over large batch changes
- If a test fails, fix the issue before moving to the next phase
- Do not modify files outside the scope defined in Section 3 without user approval