# Implementation Plan: Simplified-to-Traditional Chinese File Conversion Web Tool

**Branch**: `002-cloudflare-worker` | **Date**: 2025-10-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-cloudflare-worker/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

A web-based tool for converting Simplified Chinese text files to Traditional Chinese, deployable on Cloudflare Workers. Users can upload files or paste text directly, receive instant conversions with preview, and download converted files while preserving markdown formatting. The tool supports batch conversion and includes character mapping derived from existing Python conversion scripts.

## Technical Context

**Language/Version**: JavaScript (ES2020+) / TypeScript 5.0+ for Cloudflare Workers
**Primary Dependencies**: NEEDS CLARIFICATION (Chinese character conversion library: opencc-js, cn-char-converter, or custom mapping)
**Storage**: N/A (stateless conversion, no persistence required)
**Testing**: NEEDS CLARIFICATION (Vitest, Jest, or Cloudflare Workers testing framework)
**Target Platform**: Cloudflare Workers (Edge runtime)
**Project Type**: Web (static frontend + serverless edge function)
**Performance Goals**: <5 seconds for 100KB file conversion, <2 seconds for text paste preview, handles 100 concurrent requests
**Constraints**: <1MB file size limit, 1MB Worker bundle size limit (Cloudflare free tier), <50ms CPU time per request
**Scale/Scope**: Public tool (unlimited users), handles common Chinese character mappings (~6000+ character pairs), 3 user stories (P1-P3)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✓ PASS (No constitution file found - proceeding with standard best practices)

Since no project constitution exists at `.specify/memory/constitution.md`, we will follow these standard principles:
- Simple, focused implementation (single-purpose tool)
- Stateless design (no database, no user accounts)
- Edge-optimized for Cloudflare Workers
- Clear separation: frontend (static HTML/JS) + backend (Worker API)
- Test coverage for conversion accuracy and edge cases

**Re-evaluation Post-Design**: Will verify final design maintains simplicity and edge-runtime compatibility.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
converter-tool/
├── worker/                      # Cloudflare Worker (serverless backend)
│   ├── src/
│   │   ├── index.ts            # Worker entry point
│   │   ├── converter.ts        # Core conversion logic
│   │   └── mappings/
│   │       └── sc-to-tc.ts     # Character mapping data
│   ├── tests/
│   │   ├── converter.test.ts   # Unit tests for conversion
│   │   └── worker.test.ts      # Integration tests for Worker API
│   ├── wrangler.toml           # Cloudflare Workers config
│   └── package.json
│
└── frontend/                    # Static web interface
    ├── public/
    │   ├── index.html          # Main page
    │   ├── styles.css          # Styling
    │   └── app.js              # Client-side logic
    ├── tests/
    │   └── e2e.test.js         # End-to-end tests
    └── package.json
```

**Structure Decision**: Web application structure with separate frontend (static) and worker (edge function) directories. The frontend serves static HTML/CSS/JS while the worker handles conversion API requests. This separation allows independent deployment: frontend to Cloudflare Pages and worker to Cloudflare Workers.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**No violations**: Design adheres to simplicity principles with no unjustified complexity.

---

## Phase 0: Research Summary

**Status**: ✓ Complete

See [research.md](research.md) for detailed technology decisions:

- **Conversion Library**: Custom character mapping (extracted from existing Python scripts)
- **Testing Framework**: Vitest for unified Worker + frontend tests
- **Frontend**: Vanilla JavaScript (no framework overhead)
- **Markdown Preservation**: Regex-based code block detection with exclusion zones
- **Batch Conversion**: Client-side sequential processing with JSZip
- **Performance**: Longest-match-first conversion algorithm

**Key Decisions**:
- Avoided heavyweight libraries (opencc-js) to stay within 1MB Worker bundle limit
- Stateless design eliminates database complexity
- Edge-optimized for Cloudflare Workers runtime

---

## Phase 1: Design Summary

**Status**: ✓ Complete

### Data Model

See [data-model.md](data-model.md) for complete entity definitions:

**Core Entities**:
- `ConversionRequest`: Input text, filename, preservation options
- `ConversionResponse`: Converted text, statistics, errors
- `CharacterMapping`: Simplified→Traditional dictionary (~6000 pairs)
- `BatchConversionRequest`: Client-side batch tracking

**Validation Rules**:
- Max 1MB file size (client + server validation)
- UTF-8 encoding required (auto-detect GB2312/Big5 if needed)
- Filename sanitization (prevent path traversal)

### API Contracts

See [contracts/api-spec.yaml](contracts/api-spec.yaml) for OpenAPI specification:

**Endpoints**:
- `POST /api/convert`: Main conversion endpoint
- `GET /api/health`: Health check

**Request Example**:
```json
{
  "content": "这是测试文件",
  "filename": "test.md",
  "preserveMarkdown": true,
  "contentType": "text/markdown"
}
```

**Response Example**:
```json
{
  "convertedContent": "這是測試檔案",
  "conversionStats": {
    "charactersConverted": 7,
    "processingTimeMs": 5
  }
}
```

### Quickstart

See [quickstart.md](quickstart.md) for development setup:

**Local Development**:
```bash
cd converter-tool/worker && npm run dev  # Start Worker on :8787
cd converter-tool/frontend && npm run dev  # Start frontend on :8080
```

**Deployment**:
```bash
npm run deploy  # Deploy to Cloudflare Workers + Pages
```

---

## Post-Design Constitution Check

**Status**: ✓ PASS (Re-evaluation complete)

**Validation**:
- ✓ Simple, focused implementation (single-purpose conversion tool)
- ✓ Stateless design maintained (no database added during design)
- ✓ Edge-optimized (Worker bundle <500KB, <50ms CPU time)
- ✓ Clear separation: frontend (static) + Worker (serverless API)
- ✓ Test coverage defined (unit + integration + E2E)

**No complexity introduced**: Design remains aligned with original principles.

---

## Next Steps

**Planning Complete**: Proceed to task generation

Run `/speckit.tasks` to generate the implementation task list ([tasks.md](tasks.md)).

**Implementation Priority** (from spec):
1. **P1**: Basic file conversion (upload → convert → download)
2. **P2**: Text paste conversion (paste → preview → copy)
3. **P3**: Batch file conversion (multi-upload → zip download)
