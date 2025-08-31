# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project (currently) does not strictly follow SemVer releases. Dates are in YYYY-MM-DD.

## Unreleased

### Added
- Unified image slider component (`SwipeCarousel`) used on product list cards and product details.
- Drag-follow swipe with mouse/touch, circular arrow controls, and dots.
- Product details gallery now uses the same slider; lightbox removed to prevent gesture conflicts.
- Variant images are normalized to MinIO during sync and used to backfill product galleries (deduplicated). Backfilled images are registered in `media_files`.
- Documentation updates: README sections for slider UX and image normalization.

### Changed
- Product details layout/header polish and sticky details card.

### Fixed
- Keyboard handler in slider uses typed listener without `any`.

## 2025-08-31
- Repository hygiene updates and ESLint auto-fixes.
