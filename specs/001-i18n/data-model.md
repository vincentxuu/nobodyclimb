# Data Model: i18n (Internationalization)

**Date**: 2026-02-10 | **Plan**: [plan.md](./plan.md)

## Overview

i18n 功能不涉及資料庫 schema 變更。核心「資料模型」為翻譯檔的 JSON 結構、TypeScript 型別定義，以及 locale 設定常數。

## Entities

### E-1: Locale Configuration

```typescript
// packages/i18n/constants.ts

export const SUPPORTED_LOCALES = ['zh-TW', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'zh-TW';

export const LOCALE_LABELS: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  'en': 'English',
};

// URL prefix mapping (default locale has no prefix)
export const LOCALE_PREFIX_MAP: Record<Locale, string> = {
  'zh-TW': '',    // default, no prefix
  'en': '/en',
};
```

### E-2: Translation Message Types (Shared)

```typescript
// packages/i18n/types.ts

// Common namespace (buttons, labels, dates)
export interface CommonMessages {
  save: string;
  cancel: string;
  confirm: string;
  delete: string;
  edit: string;
  search: string;
  loading: string;
  noResults: string;
  backToHome: string;
  learnMore: string;
  joinNow: string;
  viewAll: string;
  share: string;
  report: string;
}

// Navigation namespace
export interface NavMessages {
  home: string;
  biography: string;
  crag: string;
  gym: string;
  gallery: string;
  videos: string;
  blog: string;
  about: string;
  profile: string;
  admin: string;
  search: string;
  login: string;
  register: string;
  logout: string;
}

// Auth namespace
export interface AuthMessages {
  loginTitle: string;
  registerTitle: string;
  email: string;
  password: string;
  confirmPassword: string;
  forgotPassword: string;
  resetPassword: string;
  loginButton: string;
  registerButton: string;
  orContinueWith: string;
  alreadyHaveAccount: string;
  noAccount: string;
}

// Crag namespace (climbing-related terms)
export interface CragMessages {
  cragTitle: string;
  gymTitle: string;
  location: string;
  difficulty: string;
  routes: string;
  routeCount: string;
  area: string;
  approach: string;
  rockType: string;
  season: string;
  searchPlaceholder: string;
}

// Error namespace
export interface ErrorMessages {
  generic: string;
  notFound: string;
  unauthorized: string;
  forbidden: string;
  serverError: string;
  networkError: string;
  validationError: string;
  fileTooLarge: string;
  unsupportedFormat: string;
  sessionExpired: string;
  rateLimited: string;
}

// Aggregate type for all shared messages
export interface SharedMessages {
  common: CommonMessages;
  nav: NavMessages;
  auth: AuthMessages;
  crag: CragMessages;
  errors: ErrorMessages;
}
```

### E-3: Translation Message Types (Web-specific)

```typescript
// apps/web/src/types/i18n.ts (or generated from JSON)

export interface MetadataMessages {
  siteTitle: string;
  siteDescription: string;
  // Per-page titles and descriptions
  homeTitle: string;
  homeDescription: string;
  aboutTitle: string;
  aboutDescription: string;
  biographyTitle: string;
  biographyDescription: string;
  cragTitle: string;
  cragDescription: string;
  gymTitle: string;
  gymDescription: string;
  galleryTitle: string;
  galleryDescription: string;
  blogTitle: string;
  blogDescription: string;
}

export interface BiographyMessages {
  sectionTitle: string;
  featured: string;
  readMore: string;
  questionPrompt: string;
  shareYourStory: string;
  // Biography interaction
  likeButton: string;
  commentButton: string;
  reactionMeToo: string;
  reactionPlusOne: string;
  reactionWellSaid: string;
}

export interface AboutMessages {
  heroTitle: string;
  heroSubtitle: string;
  originTitle: string;
  originContent: string;
  missionTitle: string;
  missions: Record<string, { title: string; description: string }>;
  featuresTitle: string;
  features: Record<string, { title: string; description: string }>;
  statsTitle: string;
}

// Web-only messages aggregate
export interface WebMessages {
  metadata: MetadataMessages;
  biography: BiographyMessages;
  about: AboutMessages;
  // ... more web-specific namespaces
}
```

### E-4: next-intl Configuration Types

```typescript
// apps/web/src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@nobodyclimb/i18n';

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed', // zh-TW: no prefix, en: /en/
});
```

```typescript
// apps/web/src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: {
      // Shared namespaces
      common: (await import(`@nobodyclimb/i18n/locales/${locale}/common.json`)).default,
      nav: (await import(`@nobodyclimb/i18n/locales/${locale}/nav.json`)).default,
      auth: (await import(`@nobodyclimb/i18n/locales/${locale}/auth.json`)).default,
      crag: (await import(`@nobodyclimb/i18n/locales/${locale}/crag.json`)).default,
      errors: (await import(`@nobodyclimb/i18n/locales/${locale}/errors.json`)).default,
      // Web-specific namespaces
      metadata: (await import(`../../../messages/${locale}/metadata.json`)).default,
      biography: (await import(`../../../messages/${locale}/biography.json`)).default,
      about: (await import(`../../../messages/${locale}/about.json`)).default,
    },
  };
});
```

### E-5: Backend Error Translation Structure

```typescript
// backend/src/i18n/types.ts

export interface BackendMessages {
  errors: {
    // Auth errors
    INVALID_CREDENTIALS: string;
    TOKEN_EXPIRED: string;
    INSUFFICIENT_PERMISSIONS: string;
    ACCOUNT_DISABLED: string;
    EMAIL_ALREADY_EXISTS: string;

    // Validation errors
    REQUIRED_FIELD: string;     // "{field} is required" → "{field} 為必填欄位"
    INVALID_FORMAT: string;     // "{field} format is invalid"
    TOO_LONG: string;           // "{field} exceeds {max} characters"
    TOO_SHORT: string;          // "{field} must be at least {min} characters"

    // Resource errors
    RESOURCE_NOT_FOUND: string;  // "{resource} not found"
    RESOURCE_ALREADY_EXISTS: string;
    OPERATION_FAILED: string;

    // Rate limiting
    RATE_LIMITED: string;
    TOO_MANY_REQUESTS: string;
  };
  success: {
    CREATED: string;
    UPDATED: string;
    DELETED: string;
  };
}
```

## Translation JSON Examples

### Shared: `packages/i18n/locales/zh-TW/common.json`

```json
{
  "save": "儲存",
  "cancel": "取消",
  "confirm": "確認",
  "delete": "刪除",
  "edit": "編輯",
  "search": "搜尋",
  "loading": "載入中...",
  "noResults": "沒有找到結果",
  "backToHome": "回到首頁",
  "learnMore": "了解更多",
  "joinNow": "立即加入",
  "viewAll": "查看全部",
  "share": "分享",
  "report": "檢舉"
}
```

### Shared: `packages/i18n/locales/en/common.json`

```json
{
  "save": "Save",
  "cancel": "Cancel",
  "confirm": "Confirm",
  "delete": "Delete",
  "edit": "Edit",
  "search": "Search",
  "loading": "Loading...",
  "noResults": "No results found",
  "backToHome": "Back to Home",
  "learnMore": "Learn More",
  "joinNow": "Join Now",
  "viewAll": "View All",
  "share": "Share",
  "report": "Report"
}
```

### Shared: `packages/i18n/locales/zh-TW/nav.json`

```json
{
  "home": "首頁",
  "biography": "人物誌",
  "crag": "岩場",
  "gym": "岩館",
  "gallery": "攝影集",
  "videos": "影片",
  "blog": "部落格",
  "about": "關於",
  "profile": "個人檔案",
  "admin": "管理後台",
  "search": "搜尋",
  "login": "登入",
  "register": "註冊",
  "logout": "登出"
}
```

## Key Relationships

```
packages/i18n (shared)
    ↓ imported by
apps/web/src/i18n/request.ts ← merges → apps/web/messages/ (web-specific)
    ↓ provides messages to
next-intl NextIntlClientProvider / getTranslations()
    ↓ consumed by
app/[locale]/**/*.tsx (pages & components)

packages/i18n (shared)
    ↓ imported by
apps/mobile/src/i18n/config.ts ← merges → apps/mobile/locales/ (mobile-specific)
    ↓ provides messages to
react-i18next I18nextProvider
    ↓ consumed by
app/**/*.tsx (Expo Router pages & components)

backend/src/i18n/ (backend-only)
    ↓ loaded by
backend/src/middleware/language.ts
    ↓ consumed by
backend/src/routes/**/*.ts (API error responses)
```

## State Transitions

N/A — i18n 不涉及狀態機。語系選擇為純靜態設定（cookie + URL path）。

## Validation Rules

| Rule | Scope | Description |
|------|-------|-------------|
| All locale JSONs must have identical keys | CI check | `zh-TW/*.json` 和 `en/*.json` 的 key 結構必須一致 |
| No empty translation values | CI check | 翻譯值不可為空字串 |
| ICU variable names must match across locales | CI check | `{name}` 在所有語系版本中必須出現 |
| Locale URL prefix must be valid | Runtime | Middleware 只接受 `SUPPORTED_LOCALES` 中定義的語系 |
| Default locale cookie expires in 1 year | Runtime | `NEXT_LOCALE` cookie maxAge |
