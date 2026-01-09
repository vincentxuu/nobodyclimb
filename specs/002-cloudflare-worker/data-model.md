# Data Model: Simplified-to-Traditional Chinese Conversion Tool

**Feature**: 002-cloudflare-worker
**Date**: 2025-10-11
**Status**: Draft

## Overview

This document defines the data entities and their relationships for the Chinese character conversion tool. Since the tool is stateless with no persistence layer, these models represent runtime data structures (request/response objects) rather than database schemas.

---

## Entities

### 1. ConversionRequest

Represents a single conversion request from the client to the Worker API.

**Purpose**: Encapsulates all input data needed to perform a conversion

**Attributes**:

| Attribute | Type | Required | Validation Rules | Description |
|-----------|------|----------|------------------|-------------|
| `content` | string | Yes | Max 1MB (1,048,576 bytes), UTF-8 encoded | The Simplified Chinese text to convert |
| `filename` | string | No | Max 255 chars, sanitized (no path separators) | Original filename for download naming |
| `preserveMarkdown` | boolean | No | Default: `true` | Whether to preserve markdown code blocks |
| `contentType` | string | No | MIME type: `text/plain`, `text/markdown` | File MIME type for response headers |

**Example**:
```typescript
{
  content: "这是一个测试文件。\n\n```python\nprint('hello')\n```",
  filename: "test.md",
  preserveMarkdown: true,
  contentType: "text/markdown"
}
```

**State Transitions**: N/A (stateless request object)

**Validation Logic**:
- `content` size check: Reject if `Buffer.byteLength(content, 'utf8') > 1048576`
- `filename` sanitization: Extract basename, remove path separators
- `contentType` whitelist: Only allow `text/plain`, `text/markdown`, default to `text/plain`

---

### 2. ConversionResponse

Represents the API response containing converted text and metadata.

**Purpose**: Returns conversion results to the client

**Attributes**:

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `convertedContent` | string | Yes | The Traditional Chinese converted text |
| `originalFilename` | string | No | Sanitized original filename |
| `conversionStats` | ConversionStats | Yes | Metadata about the conversion process |
| `errors` | ErrorDetail[] | No | Array of non-fatal errors (e.g., encoding warnings) |

**Example**:
```typescript
{
  convertedContent: "這是一個測試檔案。\n\n```python\nprint('hello')\n```",
  originalFilename: "test.md",
  conversionStats: {
    charactersConverted: 7,
    processingTimeMs: 12,
    preservedCodeBlocks: 1
  },
  errors: []
}
```

**Relationships**: Contains one `ConversionStats` object

---

### 3. ConversionStats

Metadata about the conversion process.

**Purpose**: Provides transparency and debugging information

**Attributes**:

| Attribute | Type | Description |
|-----------|------|-------------|
| `charactersConverted` | number | Count of Simplified characters replaced |
| `processingTimeMs` | number | Server-side conversion duration in milliseconds |
| `preservedCodeBlocks` | number | Count of markdown code blocks preserved |
| `inputSizeBytes` | number | Size of input text in bytes |
| `outputSizeBytes` | number | Size of output text in bytes |

**Example**:
```typescript
{
  charactersConverted: 47,
  processingTimeMs: 8,
  preservedCodeBlocks: 2,
  inputSizeBytes: 1024,
  outputSizeBytes: 1156
}
```

**Derivation**:
- `charactersConverted`: Count of successful character map lookups
- `processingTimeMs`: `Date.now()` before/after conversion
- `preservedCodeBlocks`: Count of regex matches for code blocks
- `inputSizeBytes`: `Buffer.byteLength(input, 'utf8')`
- `outputSizeBytes`: `Buffer.byteLength(output, 'utf8')`

---

### 4. ErrorDetail

Represents a non-fatal error or warning during conversion.

**Purpose**: Inform user of issues without blocking conversion

**Attributes**:

| Attribute | Type | Description |
|-----------|------|-------------|
| `code` | string | Error code (e.g., `ENCODING_WARNING`, `PARTIAL_CONVERSION`) |
| `message` | string | Human-readable error message |
| `context` | object | Optional additional context (line number, character position) |

**Example**:
```typescript
{
  code: "ENCODING_WARNING",
  message: "Detected non-UTF-8 characters, attempted automatic conversion",
  context: { detectedEncoding: "GB2312" }
}
```

**Error Codes**:
- `ENCODING_WARNING`: Non-UTF-8 input detected
- `PARTIAL_CONVERSION`: Some characters could not be converted
- `MARKDOWN_PARSE_ERROR`: Code block detection failed, converted entire text
- `FILE_SIZE_WARNING`: File approaching 1MB limit (>900KB)

---

### 5. BatchConversionRequest

Represents a batch conversion request (used client-side only).

**Purpose**: Track multiple file conversions on the frontend

**Attributes**:

| Attribute | Type | Description |
|-----------|------|-------------|
| `files` | File[] | Array of File objects from input element |
| `totalFiles` | number | Total count of files to convert |
| `completedFiles` | number | Count of completed conversions |
| `failedFiles` | FailedFile[] | Array of files that failed conversion |
| `results` | ConversionResponse[] | Array of successful conversion results |

**Note**: This entity exists only in frontend JavaScript, not transmitted to Worker API

**Example**:
```typescript
{
  files: [File, File, File],
  totalFiles: 3,
  completedFiles: 2,
  failedFiles: [{ filename: "corrupt.txt", error: "ENCODING_ERROR" }],
  results: [ConversionResponse, ConversionResponse]
}
```

---

### 6. CharacterMapping

The core conversion dictionary.

**Purpose**: Maps Simplified Chinese characters/words to Traditional Chinese

**Structure**: TypeScript Record/Object

**Format**:
```typescript
type CharacterMapping = Record<string, string>;

// Example entries:
{
  "简体": "簡體",
  "文档": "文件",
  "数据库": "資料庫",
  "配置": "配置",
  // ... ~6000+ entries
}
```

**Loading Strategy**:
- Stored as JSON file in `worker/src/mappings/sc-to-tc.json`
- Imported as TypeScript module at build time
- Bundled into Worker script (no runtime loading)

**Update Process**:
- Extracted from Python script `docs/backend/convert_tc.py`
- Extended with additional technical/domain-specific terms
- Sorted by key length (descending) for longest-match-first conversion

**Size Considerations**:
- Raw JSON: ~50KB
- Gzipped: ~10KB
- Post tree-shaking: Part of Worker bundle (<500KB total)

---

## Data Flow

### Single File Conversion Flow

```
[Client Browser]
      |
      | 1. User uploads file or pastes text
      |
      v
[Frontend JavaScript]
      |
      | 2. Validate file size (<1MB)
      | 3. Read file content as text
      | 4. Create ConversionRequest object
      |
      v
[Cloudflare Worker API]
      |
      | 5. Validate request (size, encoding)
      | 6. Load CharacterMapping
      | 7. Perform conversion (longest-match-first)
      | 8. Calculate ConversionStats
      | 9. Create ConversionResponse
      |
      v
[Frontend JavaScript]
      |
      | 10. Receive ConversionResponse
      | 11. Create Blob from convertedContent
      | 12. Trigger browser download
      |
      v
[User's Downloads Folder]
```

### Batch Conversion Flow

```
[Client Browser]
      |
      | 1. User selects multiple files
      |
      v
[Frontend JavaScript]
      |
      | 2. Create BatchConversionRequest
      | 3. FOR EACH file:
      |      a. Create ConversionRequest
      |      b. Send to Worker API
      |      c. Receive ConversionResponse
      |      d. Update progress (N/M files)
      |
      v
[JSZip Library]
      |
      | 4. Add each convertedContent to zip
      | 5. Generate zip blob
      |
      v
[Frontend JavaScript]
      |
      | 6. Trigger zip download
      |
      v
[User's Downloads Folder]
```

---

## Validation Rules Summary

### Request Validation (Worker-side)

1. **Content Size**:
   - Max 1MB (1,048,576 bytes)
   - HTTP 413 if exceeded
   - Check both `Content-Length` header and actual body size

2. **Encoding**:
   - Must be UTF-8
   - Attempt auto-detection for GB2312, Big5
   - Return ErrorDetail if conversion needed

3. **Content Type**:
   - Whitelist: `text/plain`, `text/markdown`
   - Default to `text/plain` if missing
   - Reject binary MIME types

4. **Filename**:
   - Max 255 characters
   - Sanitize with `path.basename()`
   - Remove null bytes, path separators
   - Default to `converted.txt` if missing

### Response Validation (Frontend-side)

1. **HTTP Status**:
   - 200: Success, display preview
   - 413: File too large, show error
   - 429: Rate limited, show retry message
   - 500: Server error, show generic error

2. **Content Validation**:
   - Check `convertedContent` is non-empty string
   - Verify UTF-8 encoding
   - Validate JSON structure matches ConversionResponse

---

## Error Handling Strategy

### Client-Side Errors

| Error | Handling |
|-------|----------|
| File >1MB | Show error before upload: "檔案太大 (>1MB)" |
| Invalid file type | Show warning: "僅支援文字檔案 (.txt, .md)" |
| Network error | Retry with exponential backoff (3 attempts) |
| Empty file | Show error: "檔案為空" |

### Worker-Side Errors

| Error | Response |
|-------|----------|
| Request >1MB | HTTP 413 + JSON error body |
| Invalid UTF-8 | HTTP 400 + ErrorDetail with encoding info |
| Timeout (>50ms CPU) | HTTP 503 + retry message |
| Rate limit | HTTP 429 + Retry-After header |

### Fatal vs. Non-Fatal Errors

**Fatal Errors** (block conversion):
- File size exceeded
- Invalid encoding (cannot convert)
- Network failure after retries

**Non-Fatal Errors** (continue with warnings):
- Markdown parse failure (convert entire text)
- Partial character conversion
- Encoding auto-detection

---

## Performance Targets (from Success Criteria)

| Metric | Target | Model Attribute |
|--------|--------|-----------------|
| 100KB file conversion | <5 seconds | `ConversionStats.processingTimeMs` <200ms |
| Text paste preview | <2 seconds | `ConversionStats.processingTimeMs` <50ms |
| Concurrent requests | 100 users | N/A (Worker auto-scales) |
| Conversion accuracy | 99.5% | `CharacterMapping` completeness |

---

## Storage Considerations

**No Persistence Layer**: This tool is completely stateless

- No database (PostgreSQL, etc.)
- No caching layer (Redis, etc.)
- No session storage
- No user accounts

**Rationale**:
- Stateless design aligns with Cloudflare Workers edge model
- No PII or sensitive data to protect
- Simplified deployment and scaling
- Reduces operational complexity

**Future Considerations** (if needed):
- Add Cloudflare KV for character mapping dictionary (reduce bundle size)
- Add Durable Objects for rate limiting state (if abuse occurs)
- Add R2 storage for conversion history (if user accounts added)

---

## Next Steps

Proceed to API contract definition in `contracts/` directory.
