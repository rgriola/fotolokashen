# Root Docs Policy and Prompts Handoff Workflow

Last Updated: 2026-05-03 14:10 EDT

## Purpose

This note defines how root-level documentation is kept clean and how agent planning docs are handed off to the prompts folder.

## Root Docs Policy

Keep root markdown files limited to operational and frequently used docs:

- README.md
- PROJECT_STATUS.md
- TASKS.md
- Active agent guide docs that are still in active use

Move non-operational root docs into documentation folders:

- Historical reviews and one-off audits -> docs/archive/reviews/
- Legacy notes and scratch docs -> docs/archive/notes/
- Product strategy and marketing planning -> docs/planning/strategy/

## Prompts-Folder Handoff Workflow

Use this sequence when moving agent plans from root:

1. Confirm the document is no longer part of daily root workflow.
2. Move the file to the prompts folder (user-managed destination).
3. If still relevant for repo history, keep a copy in docs/planning/ or docs/archive/.
4. Update references in README.md, TASKS.md, and docs/DOCUMENTATION_INDEX.md.
5. Add a short note in PROJECT_STATUS.md when the move impacts team workflow.

## Commit Hygiene

When doing documentation maintenance:

- Keep docs reorganization in one commit.
- Keep status/task content updates in a separate commit.
- Avoid mixing unrelated source-code changes into docs commits.

## Verification Checklist

- Root markdown list is intentional and minimal.
- No broken links to moved docs.
- Documentation index reflects new locations.
- TASKS and PROJECT_STATUS reference active priorities only.
