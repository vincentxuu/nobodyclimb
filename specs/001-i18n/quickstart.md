# Quickstart: i18n Implementation

**Date**: 2026-02-10 | **Plan**: [plan.md](./plan.md)

本文件提供 i18n 實作的快速參考指南，涵蓋各平台的基本設定與常見用法。

## 1. 共享套件 `@nobodyclimb/i18n`

### 安裝

```bash
# 在 monorepo root
cd packages && mkdir i18n && cd i18n
pnpm init
```

### package.json

```json
{
  "name": "@nobodyclimb/i18n",
  "version": "0.1.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts",
    "./locales/*": "./locales/*",
    "./constants": "./constants.ts"
  }
}
```

### 新增翻譯字串

1. 在 `packages/i18n/locales/zh-TW/<namespace>.json` 新增 key
2. 在 `packages/i18n/locales/en/<namespace>.json` 新增對應 key
3. 兩邊 key 必須一致，否則 CI 會報錯

```json
// packages/i18n/locales/zh-TW/common.json
{
  "save": "儲存",
  "newKey": "新翻譯"     // ← 新增
}

// packages/i18n/locales/en/common.json
{
  "save": "Save",
  "newKey": "New translation"  // ← 對應新增
}
```

---

## 2. Web Frontend (Next.js 15 + next-intl)

### 安裝

```bash
cd apps/web
pnpm add next-intl
```

### 設定檔案

#### `next.config.mjs`

```javascript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
};

export default withNextIntl(nextConfig);
```

#### `src/i18n/routing.ts`

```typescript
import { defineRouting } from 'next-intl/routing';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@nobodyclimb/i18n';

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',
});
```

#### `src/i18n/navigation.ts`

```typescript
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

#### `src/i18n/request.ts`

```typescript
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
      // Shared namespaces (from @nobodyclimb/i18n)
      common: (await import(`@nobodyclimb/i18n/locales/${locale}/common.json`)).default,
      nav: (await import(`@nobodyclimb/i18n/locales/${locale}/nav.json`)).default,
      auth: (await import(`@nobodyclimb/i18n/locales/${locale}/auth.json`)).default,
      crag: (await import(`@nobodyclimb/i18n/locales/${locale}/crag.json`)).default,
      errors: (await import(`@nobodyclimb/i18n/locales/${locale}/errors.json`)).default,
      // Web-specific namespaces
      metadata: (await import(`../../messages/${locale}/metadata.json`)).default,
      biography: (await import(`../../messages/${locale}/biography.json`)).default,
      about: (await import(`../../messages/${locale}/about.json`)).default,
    },
  };
});
```

#### `src/middleware.ts`

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except API routes, static files, etc.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

### 路由結構

將所有頁面移入 `app/[locale]/` 下：

```
app/
├── [locale]/
│   ├── layout.tsx      # Root layout with locale
│   ├── page.tsx        # Home
│   ├── about/
│   └── ...
├── robots.ts           # Outside [locale]
└── api/                # Outside [locale]
```

### 用法：Server Component

```tsx
// app/[locale]/about/page.tsx
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

// For metadata (server-only)
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('aboutTitle'),
    description: t('aboutDescription'),
  };
}

// Page component
export default function AboutPage() {
  const t = useTranslations('about');

  return (
    <div>
      <h1>{t('heroTitle')}</h1>
      <p>{t('heroSubtitle')}</p>
    </div>
  );
}
```

### 用法：Client Component

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function SearchBar() {
  const t = useTranslations('common');

  return (
    <input placeholder={t('search')} />
  );
}
```

### 用法：Locale-aware Navigation

```tsx
import { Link } from '@/i18n/navigation';

// Automatically prefixes with locale
<Link href="/about">About</Link>
// zh-TW → /about
// en → /en/about
```

### 用法：語系切換器

```tsx
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { SUPPORTED_LOCALES, LOCALE_LABELS } from '@nobodyclimb/i18n';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <select value={locale} onChange={(e) => handleChange(e.target.value)}>
      {SUPPORTED_LOCALES.map((loc) => (
        <option key={loc} value={loc}>
          {LOCALE_LABELS[loc]}
        </option>
      ))}
    </select>
  );
}
```

---

## 3. Mobile App (Expo + react-i18next)

### 安裝

```bash
cd apps/mobile
npx expo install expo-localization
pnpm add react-i18next i18next
```

### 設定

```typescript
// apps/mobile/src/i18n/config.ts
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

// Import shared translations
import zhTWCommon from '@nobodyclimb/i18n/locales/zh-TW/common.json';
import zhTWNav from '@nobodyclimb/i18n/locales/zh-TW/nav.json';
import enCommon from '@nobodyclimb/i18n/locales/en/common.json';
import enNav from '@nobodyclimb/i18n/locales/en/nav.json';

// Import mobile-specific translations
import zhTWMobile from '../../locales/zh-TW/mobile.json';
import enMobile from '../../locales/en/mobile.json';

const deviceLocale = getLocales()[0]?.languageTag ?? 'zh-TW';

i18next.use(initReactI18next).init({
  lng: deviceLocale.startsWith('en') ? 'en' : 'zh-TW',
  fallbackLng: 'zh-TW',
  interpolation: {
    escapeValue: false,
    prefix: '{',   // Match ICU syntax used in shared files
    suffix: '}',
  },
  resources: {
    'zh-TW': {
      common: zhTWCommon,
      nav: zhTWNav,
      mobile: zhTWMobile,
    },
    en: {
      common: enCommon,
      nav: enNav,
      mobile: enMobile,
    },
  },
  defaultNS: 'common',
});

export default i18next;
```

### Provider 整合

```tsx
// apps/mobile/app/_layout.tsx
import '../src/i18n/config';  // Initialize i18next
import { I18nextProvider } from 'react-i18next';
import i18next from '../src/i18n/config';

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18next}>
      {/* ... existing layout */}
    </I18nextProvider>
  );
}
```

### 用法

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');

  return <Text>{t('save')}</Text>;
}
```

---

## 4. Backend (Hono)

### 設定

```typescript
// backend/src/index.ts
import { languageDetector } from 'hono/language';

app.use(
  languageDetector({
    supportedLanguages: ['zh-TW', 'en'],
    fallbackLanguage: 'zh-TW',
  })
);
```

### 用法

```typescript
// In any route handler
import { t } from '../utils/i18n';

app.get('/api/v1/crags/:id', async (c) => {
  const lang = c.get('language');
  const crag = await getCrag(id);

  if (!crag) {
    return c.json({
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: t(lang, 'errors.RESOURCE_NOT_FOUND', { resource: t(lang, 'labels.crag') }),
      },
    }, 404);
  }
  // ...
});
```

---

## 5. 常見模式

### 帶參數的翻譯

```json
{ "welcome": "歡迎，{name}！" }
```

```tsx
// Web (next-intl)
t('welcome', { name: user.displayName })

// Mobile (react-i18next with ICU config)
t('welcome', { name: user.displayName })
```

### 從既有硬編碼字串遷移

**Before**:
```tsx
<h1>關於我們</h1>
<p>小人物攀岩是台灣攀岩社群平台</p>
```

**After**:
```tsx
const t = useTranslations('about');

<h1>{t('heroTitle')}</h1>
<p>{t('heroSubtitle')}</p>
```

**Translation file** (`about.json`):
```json
{
  "heroTitle": "關於我們",
  "heroSubtitle": "小人物攀岩是台灣攀岩社群平台"
}
```

### 翻譯 key 命名慣例

| Pattern | Example | Usage |
|---------|---------|-------|
| `<section>.<element>` | `hero.title` | 頁面特定元素 |
| `<action>` | `save`, `cancel` | 通用按鈕 |
| `<entity>.<property>` | `crag.location` | 資料欄位標籤 |
| `<state>.<message>` | `error.notFound` | 狀態訊息 |

---

## 6. 驗證清單

開發時確認：

- [ ] 新增翻譯 key 時，zh-TW 和 en 都有對應值
- [ ] 使用 `Link` from `@/i18n/navigation` 而非 `next/link`
- [ ] Server Component 使用 `useTranslations()` / `getTranslations()`
- [ ] Client Component 使用 `useTranslations()`
- [ ] Metadata 使用 `getTranslations()` (server-only)
- [ ] 不在 `middleware.ts` 中 import 翻譯檔（只需 routing config）
- [ ] 新頁面放在 `app/[locale]/` 下
