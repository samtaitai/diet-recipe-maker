# Implementation Plan Generator Skill

## Purpose

Generate a structured implementation plan from a user story in a technical design document, output as Markdown (.md).

## When to Use

Trigger when the user asks to "plan this user story", "break down this feature", "how should I implement this", or uploads a tech design doc asking for a dev plan.

## Inputs

**Required:**

1. **User story or technical design document** — uploaded or pasted
2. **Tech stack** — user specifies per use

**Optional:** Sprint duration, team size, priority level, existing codebase context

---

## Plan Sections (Template)

The output `.md` file follows this structure:

**1. User Story Summary** — Story statement, tech stack, total effort estimate, priority

**2. Acceptance Criteria** — Testable, binary (pass/fail) checklist items derived from the story and design doc. Format: `- [ ] AC-1: [Description]`

**3. File & Component Mapping** — Table mapping tasks → specific file paths → architectural layer (Backend/Frontend/DB/Config)

**4. Dependencies & Implementation Order** — Mermaid `graph TD` diagram + phased order (Foundation → Core Logic → Integration & Polish)

**5. Testing Strategy** — Table mapping tasks to test types (Unit/Integration/E2E) + key scenarios for happy path, edge cases, error handling

**6. Risk Assessment** — Table with risk, likelihood, impact, and concrete mitigation strategy

**7. Notes & Assumptions** — Assumptions, open questions, external dependencies

---

## Instructions for AI Agent

1. Parse the input document
2. **Ask for tech stack** if not specified — never assume
3. Extract or derive acceptance criteria from the story/requirements
4. Break into tasks (few hours to one day each), each mapped to acceptance criteria
5. Estimate effort (hours for small stories, story points for larger)
6. Map files/components with specific paths, organized by layer
7. Define dependencies with Mermaid diagram + phased order
8. Design testing strategy tied to acceptance criteria, using stack-appropriate frameworks
9. Assess risks with concrete mitigations
10. Save as `/references/implementation-plan-[kebab-case-name].md` and present with `present_files`