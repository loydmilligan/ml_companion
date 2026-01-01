# Claude Project Guide

This repo is a documentation-first product spec for the Music League Family Companion App. Use the docs as the source of truth before proposing or implementing changes.

## Primary References
- Start with `docs/README.md` to find the right document.
- Requirements live in `docs/requirements/feature_specification.md`.
- The roadmap and atomic tasks live in `docs/planning/project_plan.md`.
- UX guidance is in `docs/design/ui_specification.md`.

## Iterative Implementation Workflow
Follow this flow for each change request:
1. Describe the change: capture the user need, context, and expected impact.
2. Set goals: define concrete success criteria and any metrics.
3. Identify affected files/components: map the scope across docs, code, data, and integrations.
4. Make changes: break work into atomic tasks and implement incrementally.
5. Review work: verify correctness, completeness, and test coverage; note risks.
6. Commit changes: summarize intent in the message; use a feature branch if applicable.
7. Deploy updates: stage, validate, release, and monitor with rollback plans when relevant.

## Collaboration Notes
- Keep edits focused and avoid drifting beyond the requested scope.
- If a decision is ambiguous (e.g., licensing or platform choices), ask a brief question.

## Mobile Performance Guidelines
When discussing or implementing UI/frontend changes, always:
1. Check for mobile performance implications
2. Mention any concerns to the user before implementing
3. Consider: bundle size, re-renders, DOM complexity, network requests, animations/transforms, and polling frequency
