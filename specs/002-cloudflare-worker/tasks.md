# Tasks: Simplified-to-Traditional Chinese File Conversion Web Tool

**Input**: Design documents from `/specs/002-cloudflare-worker/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-spec.yaml

**Tests**: Test tasks are included based on plan.md specification (Vitest for Worker + frontend)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Worker**: `converter-tool/worker/src/`, `converter-tool/worker/tests/`
- **Frontend**: `converter-tool/frontend/public/`, `converter-tool/frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for both Worker and Frontend

- [ ] T001 Create project directory structure (`converter-tool/worker/` and `converter-tool/frontend/`)
- [ ] T002 [P] Initialize Worker project with TypeScript 5.0+ and package.json in `converter-tool/worker/`
- [ ] T003 [P] Initialize Frontend project with package.json in `converter-tool/frontend/`
- [ ] T004 [P] Configure Wrangler for Cloudflare Workers in `converter-tool/worker/wrangler.toml`
- [ ] T005 [P] Configure TypeScript compiler in `converter-tool/worker/tsconfig.json`
- [ ] T006 [P] Install Vitest and testing dependencies for Worker (`@cloudflare/workers-types`, `miniflare`)
- [ ] T007 [P] Setup Frontend testing with Vitest in `converter-tool/frontend/`
- [ ] T008 [P] Create `.gitignore` for both Worker and Frontend directories
- [ ] T009 [P] Setup build scripts in Worker package.json (`build`, `dev`, `test`, `deploy`)
- [ ] T010 [P] Setup dev server script in Frontend package.json (`dev`, `test`, `build`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T011 Extract character mapping from `docs/backend/convert_tc.py` to `converter-tool/worker/src/mappings/sc-to-tc.ts`
- [ ] T012 Sort character mapping by key length (descending) for longest-match-first conversion in `sc-to-tc.ts`
- [ ] T013 Create TypeScript type definitions for ConversionRequest in `converter-tool/worker/src/types.ts`
- [ ] T014 [P] Create TypeScript type definitions for ConversionResponse in `converter-tool/worker/src/types.ts`
- [ ] T015 [P] Create TypeScript type definitions for ConversionStats in `converter-tool/worker/src/types.ts`
- [ ] T016 [P] Create TypeScript type definitions for ErrorDetail in `converter-tool/worker/src/types.ts`
- [ ] T017 Implement core conversion algorithm (longest-match-first) in `converter-tool/worker/src/converter.ts`
- [ ] T018 Implement markdown code block detection regex patterns in `converter-tool/worker/src/converter.ts`
- [ ] T019 Implement exclusion zone replacement logic (UUID placeholders) in `converter-tool/worker/src/converter.ts`
- [ ] T020 Implement conversion statistics tracking in `converter-tool/worker/src/converter.ts`
- [ ] T021 Create request validation utilities (file size, encoding, content type) in `converter-tool/worker/src/validation.ts`
- [ ] T022 Create filename sanitization utility in `converter-tool/worker/src/validation.ts`
- [ ] T023 Create error response builder utilities in `converter-tool/worker/src/errors.ts`
- [ ] T024 Setup CORS headers configuration in `converter-tool/worker/src/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic File Conversion (Priority: P1) 🎯 MVP

**Goal**: Enable users to upload Simplified Chinese files, get conversion preview, and download Traditional Chinese files with markdown preservation

**Independent Test**: Upload a Simplified Chinese markdown file, verify preview shows Traditional Chinese with preserved code blocks, download file and verify content

### Tests for User Story 1

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T025 [P] [US1] Create test fixtures with Simplified Chinese sample text in `converter-tool/worker/tests/fixtures/sample-sc.txt`
- [ ] T026 [P] [US1] Create test fixtures with markdown sample in `converter-tool/worker/tests/fixtures/sample-sc.md`
- [ ] T027 [P] [US1] Unit test for conversion accuracy (99.5%+) in `converter-tool/worker/tests/converter.test.ts`
- [ ] T028 [P] [US1] Unit test for markdown code block preservation in `converter-tool/worker/tests/converter.test.ts`
- [ ] T029 [P] [US1] Unit test for mixed Simplified/Traditional text handling in `converter-tool/worker/tests/converter.test.ts`
- [ ] T030 [P] [US1] Integration test for /api/convert endpoint in `converter-tool/worker/tests/worker.test.ts`
- [ ] T031 [P] [US1] Test file size validation (reject >1MB) in `converter-tool/worker/tests/worker.test.ts`
- [ ] T032 [P] [US1] Test UTF-8 encoding validation in `converter-tool/worker/tests/worker.test.ts`

### Implementation for User Story 1 (Worker API)

- [ ] T033 [US1] Implement POST /api/convert endpoint handler in `converter-tool/worker/src/index.ts`
- [ ] T034 [US1] Add request body parsing and validation in `converter-tool/worker/src/index.ts`
- [ ] T035 [US1] Add file size limit enforcement (1MB) with 413 status in `converter-tool/worker/src/index.ts`
- [ ] T036 [US1] Integrate converter module with endpoint handler in `converter-tool/worker/src/index.ts`
- [ ] T037 [US1] Add conversion statistics calculation and response building in `converter-tool/worker/src/index.ts`
- [ ] T038 [US1] Implement error handling (400, 413, 500 responses) in `converter-tool/worker/src/index.ts`
- [ ] T039 [US1] Add GET /api/health endpoint in `converter-tool/worker/src/index.ts`

### Implementation for User Story 1 (Frontend)

- [ ] T040 [P] [US1] Create HTML structure with file upload form in `converter-tool/frontend/public/index.html`
- [ ] T041 [P] [US1] Create preview area and download button UI in `converter-tool/frontend/public/index.html`
- [ ] T042 [P] [US1] Create CSS styling with responsive layout in `converter-tool/frontend/public/styles.css`
- [ ] T043 [US1] Implement file upload handler with client-side validation (<1MB) in `converter-tool/frontend/public/app.js`
- [ ] T044 [US1] Implement FileReader API to read file content in `converter-tool/frontend/public/app.js`
- [ ] T045 [US1] Implement fetch API call to Worker /api/convert endpoint in `converter-tool/frontend/public/app.js`
- [ ] T046 [US1] Implement conversion preview display in `converter-tool/frontend/public/app.js`
- [ ] T047 [US1] Implement file download using Blob API in `converter-tool/frontend/public/app.js`
- [ ] T048 [US1] Add error handling and user-friendly error messages (檔案太大, 網路錯誤, etc.) in `converter-tool/frontend/public/app.js`
- [ ] T049 [US1] Add loading spinner during conversion in `converter-tool/frontend/public/app.js`

### Tests for User Story 1 (Frontend E2E)

- [ ] T050 [P] [US1] E2E test for file upload and preview flow in `converter-tool/frontend/tests/e2e.test.js`
- [ ] T051 [P] [US1] E2E test for file download in `converter-tool/frontend/tests/e2e.test.js`
- [ ] T052 [P] [US1] E2E test for file size validation error in `converter-tool/frontend/tests/e2e.test.js`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently
- User can upload a file
- See Traditional Chinese preview
- Download converted file
- Markdown formatting is preserved

---

## Phase 4: User Story 2 - Text Paste Conversion (Priority: P2)

**Goal**: Enable users to paste Simplified Chinese text directly, see instant conversion preview, and copy Traditional Chinese output

**Independent Test**: Paste Simplified Chinese text into textarea, verify Traditional Chinese appears immediately in output area, copy button copies to clipboard

### Tests for User Story 2

- [ ] T053 [P] [US2] Unit test for text paste instant conversion (<2s) in `converter-tool/frontend/tests/paste.test.js`
- [ ] T054 [P] [US2] E2E test for paste, preview, and copy workflow in `converter-tool/frontend/tests/e2e.test.js`
- [ ] T055 [P] [US2] Test clipboard API copy functionality in `converter-tool/frontend/tests/e2e.test.js`

### Implementation for User Story 2 (Frontend Only)

- [ ] T056 [P] [US2] Add textarea input field to HTML in `converter-tool/frontend/public/index.html`
- [ ] T057 [P] [US2] Add output textarea and copy button to HTML in `converter-tool/frontend/public/index.html`
- [ ] T058 [P] [US2] Add tab/section toggle between file upload and paste modes in `converter-tool/frontend/public/index.html`
- [ ] T059 [US2] Implement paste event handler with debouncing (300ms) in `converter-tool/frontend/public/app.js`
- [ ] T060 [US2] Implement instant API call to /api/convert for pasted text in `converter-tool/frontend/public/app.js`
- [ ] T061 [US2] Implement output area update with converted text in `converter-tool/frontend/public/app.js`
- [ ] T062 [US2] Implement copy-to-clipboard functionality using Clipboard API in `converter-tool/frontend/public/app.js`
- [ ] T063 [US2] Add visual feedback for successful copy (tooltip or toast message) in `converter-tool/frontend/public/app.js`
- [ ] T064 [US2] Add character count display (input vs output) in `converter-tool/frontend/public/app.js`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently
- User can upload files (US1) OR paste text (US2)
- Both modes work without interfering with each other

---

## Phase 5: User Story 3 - Batch File Conversion (Priority: P3)

**Goal**: Enable users to select multiple files, see conversion progress, and download a zip file with all converted documents

**Independent Test**: Select 5 Simplified Chinese files, verify progress shows "2/5" during conversion, download zip file and verify all files are correctly converted

### Tests for User Story 3

- [ ] T065 [P] [US3] Unit test for batch conversion tracking logic in `converter-tool/frontend/tests/batch.test.js`
- [ ] T066 [P] [US3] E2E test for multiple file upload with progress tracking in `converter-tool/frontend/tests/e2e.test.js`
- [ ] T067 [P] [US3] E2E test for zip file generation and download in `converter-tool/frontend/tests/e2e.test.js`
- [ ] T068 [P] [US3] Test partial failure handling (some files succeed, one fails) in `converter-tool/frontend/tests/e2e.test.js`

### Implementation for User Story 3 (Frontend Only)

- [ ] T069 [US3] Install JSZip library via npm in `converter-tool/frontend/package.json`
- [ ] T070 [P] [US3] Add multiple file input attribute to file upload form in `converter-tool/frontend/public/index.html`
- [ ] T071 [P] [US3] Add progress bar UI component in `converter-tool/frontend/public/index.html`
- [ ] T072 [P] [US3] Add file list display showing conversion status per file in `converter-tool/frontend/public/index.html`
- [ ] T073 [US3] Implement BatchConversionRequest state management in `converter-tool/frontend/public/app.js`
- [ ] T074 [US3] Implement sequential file processing loop in `converter-tool/frontend/public/app.js`
- [ ] T075 [US3] Implement progress tracking (N/M files completed) in `converter-tool/frontend/public/app.js`
- [ ] T076 [US3] Implement per-file error tracking and display in `converter-tool/frontend/public/app.js`
- [ ] T077 [US3] Implement concurrent request limiting (max 3 at a time) in `converter-tool/frontend/public/app.js`
- [ ] T078 [US3] Integrate JSZip to create zip file from converted results in `converter-tool/frontend/public/app.js`
- [ ] T079 [US3] Implement zip file download with appropriate filename in `converter-tool/frontend/public/app.js`
- [ ] T080 [US3] Add clear UI indication of successful vs failed files in `converter-tool/frontend/public/app.js`

**Checkpoint**: All user stories should now be independently functional
- User can upload single file (US1)
- User can paste text (US2)
- User can batch convert files (US3)
- All three modes work without conflicts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, optimization, and deployment readiness

### Documentation & Configuration

- [ ] T081 [P] Create README.md with project overview and links to specs in `converter-tool/`
- [ ] T082 [P] Document character mapping update process in `converter-tool/worker/README.md`
- [ ] T083 [P] Create deployment guide referencing quickstart.md in `converter-tool/DEPLOY.md`

### Performance Optimization

- [ ] T084 Bundle size optimization: Enable tree-shaking in Worker build config
- [ ] T085 Minify frontend JavaScript and CSS using terser/cssnano
- [ ] T086 Verify Worker bundle size <500KB after build
- [ ] T087 Verify frontend bundle size <100KB after build
- [ ] T088 Add performance timing logs to conversion function
- [ ] T089 Test conversion performance with 100KB file (target <200ms processing)

### Security & Reliability

- [ ] T090 [P] Add rate limiting configuration in `wrangler.toml` (100 req/min per IP)
- [ ] T091 [P] Add CSP headers to frontend HTML
- [ ] T092 [P] Audit and sanitize all user inputs (filename, content)
- [ ] T093 Test Worker error handling under high load (100 concurrent requests)
- [ ] T094 Add request/response logging (metadata only, no content) for monitoring

### Additional Testing

- [ ] T095 [P] Add unit tests for edge cases (empty file, binary file, invalid encoding) in `converter-tool/worker/tests/`
- [ ] T096 [P] Add stress test for character mapping accuracy across all 6000+ entries
- [ ] T097 [P] Test markdown preservation with complex nested structures
- [ ] T098 Verify test coverage >90% for Worker conversion logic
- [ ] T099 Run full E2E test suite against deployed preview environment

### Deployment Preparation

- [ ] T100 Create GitHub Actions workflow for CI/CD in `.github/workflows/deploy.yml`
- [ ] T101 Configure Cloudflare Pages deployment for frontend
- [ ] T102 Configure Cloudflare Workers deployment for Worker
- [ ] T103 Setup preview environments for pull requests
- [ ] T104 Verify quickstart.md setup instructions by following them from scratch
- [ ] T105 Create production deployment checklist
- [ ] T106 Setup error monitoring/alerting for production Worker

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Basic File Conversion**:
  - Can start after Foundational (Phase 2)
  - No dependencies on other stories
  - **This is the MVP** - can deploy after completing just US1

- **User Story 2 (P2) - Text Paste Conversion**:
  - Can start after Foundational (Phase 2)
  - Reuses Worker API from US1 (/api/convert endpoint)
  - Independently testable - paste mode doesn't affect file upload mode

- **User Story 3 (P3) - Batch File Conversion**:
  - Can start after Foundational (Phase 2)
  - Reuses Worker API from US1 (/api/convert endpoint)
  - Requires JSZip library (frontend only)
  - Independently testable - batch mode doesn't affect single file or paste modes

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Worker tests before Worker implementation
- Frontend tests before Frontend implementation
- Worker API must be functional before Frontend integration
- Core implementation before polish tasks

### Parallel Opportunities

#### Phase 1 (Setup)
All tasks T002-T010 can run in parallel (different directories/files)

#### Phase 2 (Foundational)
- T013-T016 (type definitions) can run in parallel
- T017-T020 (converter implementation) must run sequentially (same file)
- T021-T022 (validation utilities) can run in parallel
- T023-T024 can run in parallel

#### Phase 3 (User Story 1)
- **Tests** (T025-T032): All can run in parallel (different test files)
- **Worker** (T033-T039): Must run sequentially (editing same index.ts)
- **Frontend** (T040-T042): Can run in parallel (different files: HTML, CSS)
- **Frontend** (T043-T049): Must run sequentially (editing same app.js)
- **E2E Tests** (T050-T052): Can run in parallel (different test scenarios)

#### Phase 4 (User Story 2)
- All tests (T053-T055) can run in parallel
- HTML updates (T056-T058) can run in parallel if different sections
- app.js changes (T059-T064) must run sequentially

#### Phase 5 (User Story 3)
- All tests (T065-T068) can run in parallel
- HTML updates (T070-T072) can run in parallel
- app.js changes (T073-T080) must run sequentially

#### Phase 6 (Polish)
- All documentation (T081-T083) can run in parallel
- Performance tests can run in parallel
- Security tasks (T090-T092) can run in parallel

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all tests for User Story 1 together:
Task T027: "Unit test for conversion accuracy (99.5%+) in converter.test.ts"
Task T028: "Unit test for markdown code block preservation in converter.test.ts"
Task T029: "Unit test for mixed Simplified/Traditional text in converter.test.ts"
Task T030: "Integration test for /api/convert endpoint in worker.test.ts"
Task T031: "Test file size validation (reject >1MB) in worker.test.ts"
Task T032: "Test UTF-8 encoding validation in worker.test.ts"

# All of these test files are independent and can be written in parallel
```

---

## Parallel Example: Foundational Phase

```bash
# After T011-T012 complete, launch type definitions in parallel:
Task T013: "ConversionRequest types in types.ts"
Task T014: "ConversionResponse types in types.ts"
Task T015: "ConversionStats types in types.ts"
Task T016: "ErrorDetail types in types.ts"

# Later, launch utility files in parallel:
Task T021: "Request validation utilities in validation.ts"
Task T022: "Filename sanitization in validation.ts"
Task T023: "Error response builders in errors.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Recommended approach for fastest time-to-value:**

1. ✅ Complete Phase 1: Setup (T001-T010)
2. ✅ Complete Phase 2: Foundational (T011-T024) - CRITICAL
3. ✅ Complete Phase 3: User Story 1 (T025-T052)
4. **STOP and VALIDATE**:
   - Run all US1 tests
   - Test manually: upload file → see preview → download
   - Verify markdown preservation works
   - Test error cases (file too large, network error)
5. Deploy MVP to production
6. Gather user feedback before building US2 and US3

**Total tasks for MVP**: ~52 tasks (T001-T052)

### Incremental Delivery

**Recommended for continuous value delivery:**

1. Complete Setup + Foundational → Foundation ready (T001-T024)
2. Add User Story 1 → Test independently → Deploy/Demo (T025-T052) **← MVP!**
3. Add User Story 2 → Test independently → Deploy/Demo (T053-T064)
4. Add User Story 3 → Test independently → Deploy/Demo (T065-T080)
5. Add Polish → Final production-ready release (T081-T106)

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. **Week 1**: Team completes Setup (T001-T010) + Foundational (T011-T024) together
2. **Week 2-3**: Once Foundational is done:
   - **Developer A**: User Story 1 Worker (T025-T039)
   - **Developer B**: User Story 1 Frontend (T040-T052)
   - Or work on different user stories in parallel if prioritizing breadth over depth
3. Stories complete and integrate independently

---

## Quality Gates

### Before Starting Implementation
- [ ] All design documents reviewed and approved (spec.md, plan.md, data-model.md, contracts/)
- [ ] Character mapping extracted from Python script and verified
- [ ] Development environment setup verified (Node.js, npm, wrangler)

### After Foundational Phase (Phase 2)
- [ ] All TypeScript types defined and exported
- [ ] Converter algorithm passes manual test with sample text
- [ ] Markdown preservation regex patterns validated
- [ ] File size validation working correctly

### After Each User Story
- [ ] All tests for that story passing (unit + integration + E2E)
- [ ] Manual testing completed for all acceptance scenarios from spec.md
- [ ] Independent test verified (can demo story without other stories)
- [ ] No regressions in previous stories
- [ ] Bundle size still within limits (<500KB Worker, <100KB Frontend)

### Before Deployment
- [ ] All user stories tested independently
- [ ] All user stories tested together (no conflicts)
- [ ] Performance targets met (SC-001 through SC-007 from spec.md)
- [ ] Security audit completed (CORS, input validation, rate limiting)
- [ ] Quickstart.md validated by following setup instructions
- [ ] CI/CD pipeline tested with preview deployment

---

## Success Criteria Verification

Map tasks to Success Criteria from spec.md:

| Success Criteria | Related Tasks | Verification Method |
|------------------|---------------|---------------------|
| SC-001: 100KB file in <5s | T017-T020, T089 | Performance test with timer |
| SC-002: 99.5% accuracy | T011, T027, T096 | Test against fixture corpus |
| SC-003: 95% first-try success | T048, T092 | User testing / error analytics |
| SC-004: 100% markdown preservation | T018-T019, T028, T097 | Test suite with various markdown |
| SC-005: Paste in <2s | T060, T089 | Performance test for paste handler |
| SC-006: 100 concurrent requests | T093 | Load testing |
| SC-007: <5% abandonment | T048 | Error message clarity testing |

---

## Notes

- [P] tasks = different files, no dependencies between them
- [Story] label (US1, US2, US3) maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests written FIRST, ensure they FAIL before implementing
- Commit after each task or logical group of related tasks
- Stop at any checkpoint to validate story independently
- **Worker uses TypeScript**, Frontend uses vanilla JavaScript
- **Character mapping is the heart of the system** - verify accuracy early
- **Bundle size is critical** - monitor during development, not just at the end
- **Each user story adds incremental value** - can stop after any story and still have a useful tool

---

## File Path Reference

Quick reference for all files to be created/modified:

### Worker (`converter-tool/worker/`)
```
src/
├── index.ts              # Main Worker entry, routes, CORS (T033-T039)
├── converter.ts          # Core conversion algorithm (T017-T020)
├── validation.ts         # Input validation utilities (T021-T022)
├── errors.ts             # Error response builders (T023)
├── types.ts              # TypeScript type definitions (T013-T016)
└── mappings/
    └── sc-to-tc.ts       # Character mapping dictionary (T011-T012)

tests/
├── converter.test.ts     # Unit tests for conversion (T027-T029)
├── worker.test.ts        # Integration tests for API (T030-T032)
└── fixtures/
    ├── sample-sc.txt     # Test fixture (T025)
    └── sample-sc.md      # Test fixture (T026)

wrangler.toml             # Worker config (T004, T090)
tsconfig.json             # TypeScript config (T005)
package.json              # Dependencies and scripts (T002)
```

### Frontend (`converter-tool/frontend/`)
```
public/
├── index.html            # Main UI structure (T040-T041, T056-T058, T070-T072)
├── styles.css            # CSS styling (T042)
└── app.js                # Client-side logic (T043-T049, T059-T064, T073-T080)

tests/
├── e2e.test.js           # E2E tests (T050-T052, T054-T055, T066-T068)
├── paste.test.js         # Paste mode tests (T053)
└── batch.test.js         # Batch mode tests (T065)

package.json              # Dependencies including JSZip (T003, T069)
```

### Root (`converter-tool/`)
```
README.md                 # Project overview (T081)
DEPLOY.md                 # Deployment guide (T083)
.github/workflows/
└── deploy.yml            # CI/CD pipeline (T100)
```

---

**Total Tasks**: 106 tasks
**MVP Tasks (US1 only)**: 52 tasks (T001-T052)
**Test Tasks**: 27 tasks (26% of total)
**Parallelizable Tasks**: ~45 tasks marked with [P]

**Estimated Timeline**:
- MVP (US1): 2-3 weeks for single developer
- All 3 user stories: 4-5 weeks for single developer
- With 2 developers working in parallel: 2-3 weeks for all stories
