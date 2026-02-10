# API Contract: Localized Error Responses

**Date**: 2026-02-10 | **Plan**: [../plan.md](../plan.md)

## Overview

Backend API 錯誤回應根據 `Accept-Language` header 回傳對應語系的錯誤訊息。

## Language Detection

### Request Header

```
Accept-Language: en,zh-TW;q=0.8
```

### Detection Logic (Hono Language Detector)

```
1. 解析 Accept-Language header
2. 比對 supportedLanguages: ['zh-TW', 'en']
3. 回傳最高優先且支援的語系
4. 無匹配時 fallback 為 'zh-TW'
```

### Context Access

```typescript
// In any route handler:
const lang = c.get('language'); // 'zh-TW' | 'en'
```

## Error Response Format

### Current Format (unchanged structure)

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "找不到指定的岩場"
  }
}
```

### Localized Format (same structure, localized message)

**zh-TW** (`Accept-Language: zh-TW`):
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "找不到指定的岩場"
  }
}
```

**en** (`Accept-Language: en`):
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The specified crag was not found"
  }
}
```

### Key Points

- `error.code` 保持不變（英文 constant，供前端程式碼判斷）
- `error.message` 根據語系翻譯（供 UI 顯示）
- Response structure 不變，不影響既有 API contract

## Error Code → Message Mapping

### Authentication Errors

| Code | zh-TW | en |
|------|-------|-----|
| `INVALID_CREDENTIALS` | 帳號或密碼錯誤 | Invalid email or password |
| `TOKEN_EXPIRED` | 登入已過期，請重新登入 | Session expired, please log in again |
| `INSUFFICIENT_PERMISSIONS` | 權限不足 | Insufficient permissions |
| `ACCOUNT_DISABLED` | 此帳號已被停用 | This account has been disabled |
| `EMAIL_ALREADY_EXISTS` | 此信箱已被註冊 | This email is already registered |

### Validation Errors

| Code | zh-TW | en |
|------|-------|-----|
| `REQUIRED_FIELD` | {field} 為必填欄位 | {field} is required |
| `INVALID_FORMAT` | {field} 格式不正確 | {field} format is invalid |
| `TOO_LONG` | {field} 不可超過 {max} 個字元 | {field} must not exceed {max} characters |
| `TOO_SHORT` | {field} 至少需要 {min} 個字元 | {field} must be at least {min} characters |
| `INVALID_EMAIL` | 請輸入有效的電子信箱 | Please enter a valid email address |

### Resource Errors

| Code | zh-TW | en |
|------|-------|-----|
| `RESOURCE_NOT_FOUND` | 找不到指定的{resource} | The specified {resource} was not found |
| `RESOURCE_ALREADY_EXISTS` | {resource}已存在 | {resource} already exists |
| `OPERATION_FAILED` | 操作失敗，請稍後再試 | Operation failed, please try again later |

### Rate Limiting

| Code | zh-TW | en |
|------|-------|-----|
| `RATE_LIMITED` | 請求過於頻繁，請稍後再試 | Too many requests, please try again later |

### Success Messages

| Code | zh-TW | en |
|------|-------|-----|
| `CREATED` | 建立成功 | Created successfully |
| `UPDATED` | 更新成功 | Updated successfully |
| `DELETED` | 刪除成功 | Deleted successfully |

## Implementation Example

```typescript
// backend/src/i18n/zh-tw.json
{
  "errors": {
    "INVALID_CREDENTIALS": "帳號或密碼錯誤",
    "TOKEN_EXPIRED": "登入已過期，請重新登入",
    "RESOURCE_NOT_FOUND": "找不到指定的{resource}",
    "REQUIRED_FIELD": "{field} 為必填欄位",
    "RATE_LIMITED": "請求過於頻繁，請稍後再試"
  },
  "success": {
    "CREATED": "建立成功",
    "UPDATED": "更新成功",
    "DELETED": "刪除成功"
  }
}

// backend/src/i18n/en.json
{
  "errors": {
    "INVALID_CREDENTIALS": "Invalid email or password",
    "TOKEN_EXPIRED": "Session expired, please log in again",
    "RESOURCE_NOT_FOUND": "The specified {resource} was not found",
    "REQUIRED_FIELD": "{field} is required",
    "RATE_LIMITED": "Too many requests, please try again later"
  },
  "success": {
    "CREATED": "Created successfully",
    "UPDATED": "Updated successfully",
    "DELETED": "Deleted successfully"
  }
}
```

```typescript
// backend/src/utils/i18n.ts
import zhTW from '../i18n/zh-tw.json';
import en from '../i18n/en.json';

const messages = { 'zh-TW': zhTW, 'en': en };

export function t(lang: string, key: string, params?: Record<string, string>): string {
  const locale = messages[lang] || messages['zh-TW'];
  const parts = key.split('.');
  let value: any = locale;
  for (const part of parts) {
    value = value?.[part];
  }
  if (typeof value !== 'string') return key;
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, k) => params[k] || `{${k}}`);
  }
  return value;
}
```
