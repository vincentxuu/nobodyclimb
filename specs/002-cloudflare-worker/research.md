# Research: Simplified-to-Traditional Chinese Conversion Tool

**Feature**: 002-cloudflare-worker
**Date**: 2025-10-11
**Status**: Complete

## Overview

This document captures research findings and technology decisions for the Simplified-to-Traditional Chinese file conversion web tool deployable on Cloudflare Workers.

## Technology Decisions

### 1. Chinese Character Conversion Library

**Decision**: Use custom character mapping based on existing Python scripts (extracted to JavaScript/TypeScript)

**Rationale**:
- The project already has proven conversion mappings in `docs/backend/convert_tc.py` with ~100+ common word/character pairs
- Custom mapping provides full control over conversion accuracy and can be optimized for the specific domain (technical documentation)
- Avoids external library dependencies that may exceed Cloudflare Workers 1MB bundle size limit
- Lightweight: character mapping dictionary is small (~50KB as JSON)
- Popular libraries like `opencc-js` are heavyweight (200KB+) and include unnecessary conversions

**Alternatives Considered**:
- **opencc-js**: Full-featured conversion library, but 200KB+ bundle size, includes dictionary files for literary text
  - Rejected: Too large for Workers free tier, overkill for technical documentation
- **cn-char-converter**: Smaller library (~80KB), but still adds dependency weight
  - Rejected: Custom mapping is lighter and more maintainable
- **Browser-based OpenCC**: Requires loading large dictionary files on client side
  - Rejected: Slow initial load, poor UX for first-time users

**Implementation Notes**:
- Extract character mapping from `convert_tc.py` to TypeScript constant
- Expand mapping with additional technical terms specific to climbing/documentation domain
- Structure as key-value pairs: `{ '简体': '繁體', ... }`
- Conversion algorithm: simple string replacement with longest-match-first strategy

---

### 2. Testing Framework

**Decision**: Vitest for both Worker and frontend tests

**Rationale**:
- Native TypeScript support without configuration
- Fast execution with hot module replacement
- Compatible with Cloudflare Workers runtime via miniflare integration
- Unified testing framework for both frontend and Worker code
- Active maintenance and growing ecosystem

**Alternatives Considered**:
- **Jest**: Industry standard, but slower and requires Babel for TypeScript
  - Rejected: Slower test execution, more configuration needed
- **Cloudflare Workers testing utilities**: Official, but limited to Worker-specific tests
  - Rejected: Would require separate frontend testing framework
- **Playwright/Puppeteer**: E2E testing only
  - Rejected: Will use as supplement for E2E, not for unit tests

**Implementation Notes**:
- Use `@cloudflare/workers-types` for Worker type definitions
- Use `miniflare` for local Worker testing
- Create test fixtures with sample Simplified Chinese text
- Target 90%+ code coverage for conversion logic

---

### 3. Frontend Framework

**Decision**: Vanilla JavaScript (no framework)

**Rationale**:
- Simple UI with minimal state management needs (file upload, text area, download button)
- Avoids framework bundle size and build complexity
- Faster initial load time for users
- Direct access to File API, Clipboard API, and Blob APIs
- Easy to maintain and update

**Alternatives Considered**:
- **React/Vue/Svelte**: Popular frameworks with component architecture
  - Rejected: Overkill for simple 3-4 UI interactions, adds 40KB+ to bundle
- **Lit (Web Components)**: Lightweight framework for custom elements
  - Rejected: Not needed for single-page tool with minimal components
- **Alpine.js**: Minimal framework for reactivity
  - Rejected: Reactivity not needed; simple event handlers sufficient

**Implementation Notes**:
- Use modern ES6+ features (async/await, fetch, modules)
- Organize code into modules: `upload.js`, `converter.js`, `download.js`
- Use CSS Grid/Flexbox for responsive layout
- Progressive enhancement: core functionality works without JavaScript (form fallback)

---

### 4. Markdown Preservation Strategy

**Decision**: Regex-based code block detection with exclusion zones

**Rationale**:
- Markdown code blocks (backticks), links, and URLs should not be converted
- Regex patterns can identify code blocks: `` `code` `` and ` ```block``` `
- Create "exclusion zones" during conversion, restore after character replacement
- Lightweight solution without markdown parser dependency

**Alternatives Considered**:
- **Unified/Remark**: Full markdown AST parser
  - Rejected: 100KB+ bundle size, overkill for preserving code blocks
- **Marked.js**: Markdown to HTML parser
  - Rejected: We need text-to-text, not text-to-HTML; adds unnecessary parsing
- **Simple marker replacement**: Replace code blocks with placeholders before conversion
  - Rejected: Fragile if placeholders contain Chinese characters

**Implementation Notes**:
- Detect inline code: `` `(.*?)` ``
- Detect code blocks: ` ```[\s\S]*?``` `
- Detect URLs: `https?://[^\s]+` and markdown links: `\[.*?\]\(.*?\)`
- Replace with UUID placeholders, convert text, restore original content
- Test with nested code blocks and mixed content

---

### 5. File Size Limit Enforcement

**Decision**: Client-side validation (1MB) + Worker-side validation (1MB)

**Rationale**:
- Double validation prevents malicious requests and provides immediate user feedback
- Client-side: Check `file.size` before upload, show error without API call
- Worker-side: Enforce limit in Worker to prevent abuse via direct API calls
- 1MB limit aligns with Cloudflare Workers request size limits (10MB max, but 1MB practical)

**Alternatives Considered**:
- **Client-side only**: Fast feedback, but can be bypassed
  - Rejected: Security risk for public tool
- **Worker-side only**: Secure, but wastes bandwidth on large uploads
  - Rejected: Poor UX, user waits for upload before seeing error
- **Streaming validation**: Check size during upload
  - Rejected: Adds complexity, not needed for 1MB limit

**Implementation Notes**:
- Frontend: Check `file.size` property, display friendly error: "文件太大，請上傳小於 1MB 的檔案"
- Worker: Check `request.headers.get('content-length')` and reject with 413 status
- Log rejected requests for monitoring abuse patterns

---

### 6. Batch Conversion Implementation

**Decision**: Sequential client-side processing with progress tracking

**Rationale**:
- Client receives multiple files, sends one request per file to Worker
- Display progress bar showing N/M files completed
- Generate zip file client-side using JSZip library
- Avoids Worker timeout limits (50ms CPU time per request)

**Alternatives Considered**:
- **Worker-side zip generation**: Worker receives multiple files, returns zip
  - Rejected: Increases Worker CPU time, risks timeout for 5+ files
- **Parallel uploads**: Send all files simultaneously
  - Rejected: May overwhelm Worker with concurrent requests, no progress feedback
- **Server-side batch endpoint**: Single endpoint for multiple files
  - Rejected: Complex state management, not suitable for stateless Workers

**Implementation Notes**:
- Use `JSZip` library (20KB minified) for client-side zip creation
- Show progress: "正在轉換 2/5 檔案..."
- Handle partial failures: Download successful conversions, show error list
- Limit concurrent requests to 3 to avoid overwhelming Worker

---

## Performance Optimization

### Conversion Algorithm

**Strategy**: Longest-match-first character replacement

**Details**:
- Sort mapping dictionary by key length (descending)
- Apply replacements from longest to shortest to avoid partial matches
- Example: Convert '数据库' (database) before '数据' (data) to preserve compound words

**Expected Performance**:
- 100KB file: ~200ms conversion time (5000 operations on 6000-char dictionary)
- Acceptable for SC-005: <2 seconds paste-to-preview requirement

### Bundle Size Optimization

**Targets**:
- Worker bundle: <500KB (includes TypeScript compiled code + character mapping)
- Frontend bundle: <100KB (vanilla JS + JSZip)
- Character mapping JSON: <50KB (gzip compression reduces to ~10KB)

**Techniques**:
- Tree-shaking unused code
- Minification with terser
- Gzip compression (automatic via Cloudflare CDN)

---

## Edge Cases & Error Handling

### 1. Mixed Simplified/Traditional Text

**Behavior**: Convert all Simplified characters, leave Traditional unchanged
**Implementation**: Character mapping only includes Simplified→Traditional pairs

### 2. Encoding Issues (Non-UTF-8)

**Behavior**: Detect encoding, attempt conversion to UTF-8, show error if fails
**Implementation**: Worker checks `Content-Type` header, tries `TextDecoder` with fallback

### 3. Already Traditional Text

**Behavior**: Return text unchanged (idempotent operation)
**Implementation**: No special handling needed; mapping doesn't match Traditional chars

### 4. Special Characters / Symbols

**Behavior**: Preserve all non-Chinese characters unchanged
**Implementation**: Character mapping only targets Chinese characters

### 5. Code Block Detection Failures

**Behavior**: Graceful degradation - convert entire text if regex fails
**Implementation**: Try-catch around regex operations, log failures for improvement

---

## Security Considerations

### 1. Input Validation

- Check file MIME types: `text/plain`, `text/markdown`, `application/octet-stream`
- Reject binary files (images, executables) by checking magic bytes
- Sanitize filenames to prevent path traversal: `path.basename()`

### 2. Rate Limiting

- Use Cloudflare Workers built-in rate limiting (100 requests/minute per IP)
- Return 429 status code with retry-after header
- Consider adding Durable Objects for advanced rate limiting if abuse occurs

### 3. Content Security

- No user data persistence (stateless processing)
- No logging of file contents (only metadata: size, type, conversion time)
- CORS headers to restrict API access to known frontend origin

---

## Deployment Strategy

### Frontend Deployment

**Platform**: Cloudflare Pages
**Process**:
1. Build static assets (minify JS/CSS)
2. Deploy to Pages via Git integration
3. Custom domain: `converter.example.com`

### Worker Deployment

**Platform**: Cloudflare Workers
**Process**:
1. Build TypeScript to JavaScript with `wrangler build`
2. Deploy with `wrangler deploy`
3. Bind Worker to route: `converter.example.com/api/*`

### CI/CD

**Platform**: GitHub Actions
**Workflow**:
- On push to `main`: Run tests → Build → Deploy to production
- On PR: Run tests → Deploy to preview environment
- Test coverage reporting with Codecov

---

## Open Questions Resolved

### Q1: Which Chinese conversion library?
**A**: Custom mapping extracted from existing Python scripts

### Q2: How to test Worker locally?
**A**: Miniflare provides local Worker runtime simulation

### Q3: How to handle batch conversions without timeout?
**A**: Client-side sequential processing with progress tracking

### Q4: Should we support PDF/Word files?
**A**: No (per spec: out of scope), focus on text/markdown only

---

## Next Steps

With research complete, proceed to Phase 1:
1. Generate `data-model.md` with entity definitions
2. Generate `contracts/` with API specifications (OpenAPI)
3. Generate `quickstart.md` with setup instructions
4. Update agent context via script
