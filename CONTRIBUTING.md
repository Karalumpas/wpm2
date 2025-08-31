# Contributing

Thanks for contributing! This project uses a simple Git flow and checks to keep quality high.

## Branching Model

- `main`: release branch. Always deployable.
- `dev`: integration branch. Target for feature merges.
- `feature/<short-description>`: work branches off `dev`.

## Typical Flow

1. Create a branch: `git checkout -b feature/slider-polish dev`
2. Install deps and run app: `npm install && npm run dev`
3. Run checks locally:
   - Lint: `npm run lint`
   - Type check: `npm run type-check`
   - Tests: `npm test`
4. Commit with a clear message. Prefer imperative (e.g., "Add X", "Fix Y").
5. Push and open a PR to `dev`.
6. Once approved/green, squash or merge. Maintainers merge `dev` → `main` on release.

## Code Style & Tests

- TypeScript strict; avoid `any`.
- Keep functions small; prefer pure helpers in `src/lib/**`.
- Add/adjust tests when modifying behavior.

## UI/UX

- Use the shared slider (`SwipeCarousel`) for image carousels.
- Keep accessibility in mind: ARIA roles/labels, keyboard affordances.

## Secrets & Data

- Never commit secrets. Use `.env.local`.
- For MinIO/PhotoPrism, rely on env variables described in README.

## Commit Message Hints

- Prefix with type when useful: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.

## PR Expectations

- What/why summary
- Screenshots or GIFs for UI work
- Notes on migration/ops, if any

Thanks!
