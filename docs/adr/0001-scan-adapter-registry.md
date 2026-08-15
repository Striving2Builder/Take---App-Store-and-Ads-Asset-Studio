# scan-adapter-registry

## Status
Accepted — Phase 2 WP0

## Context
Scan needs multiple sources (Apple, Play, OG, future ASO/Figma) without rewriting `scan.route.ts` each time.

## Decision
Introduce `ScanAdapter` + `registerAdapter` / `getAdapterForKind`. Routes resolve kind → adapter. New sources = new adapter module + registry line.

## Consequences
- Play/Apple/OG are swappable implementations
- Shared browser pool / ASO vendor can register later
- Orchestrator stays thin; line-budget friendly
