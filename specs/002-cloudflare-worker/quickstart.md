# Quickstart Guide: Simplified-to-Traditional Chinese Conversion Tool

**Feature**: 002-cloudflare-worker
**Last Updated**: 2025-10-11
**Audience**: Developers setting up the project for the first time

---

## Overview

This quickstart guide walks you through setting up the Simplified-to-Traditional Chinese conversion tool locally, running tests, and deploying to Cloudflare Workers + Pages.

**What you'll build**:
- A static web interface for file upload and text conversion
- A Cloudflare Worker API for serverless character conversion
- Automated deployment via GitHub Actions

**Time to complete**: ~30 minutes

---

## Prerequisites

### Required Tools

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (bundled with Node.js)
- **Git**: For version control
- **Cloudflare Account**: Free tier is sufficient ([Sign up](https://dash.cloudflare.com/sign-up))

### Optional Tools

- **wrangler CLI**: Cloudflare Workers development tool (installed via npm)
- **VS Code**: Recommended editor with TypeScript support

### Verify Prerequisites

```bash
node --version   # Should be v18.0.0+
npm --version    # Should be v9.0.0+
git --version    # Any recent version
```

---

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/nobodyclimb-fe.git
cd nobodyclimb-fe
git checkout 002-cloudflare-worker
```

### 2. Install Dependencies

#### Worker Dependencies

```bash
cd converter-tool/worker
npm install
```

**Installs**:
- TypeScript 5.0+
- Wrangler (Cloudflare Workers CLI)
- Vitest (testing framework)
- @cloudflare/workers-types (type definitions)

#### Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Installs**:
- JSZip (for batch conversion)
- Vitest (for E2E tests)
- http-server (for local development)

---

## Local Development

### Running the Worker Locally

The Worker runs using `wrangler dev`, which simulates the Cloudflare Workers runtime:

```bash
cd converter-tool/worker
npm run dev
```

**Expected output**:
```
⛅️ wrangler 3.0.0
------------------
⬣ Listening at http://localhost:8787
```

**Test the API**:
```bash
curl -X POST http://localhost:8787/api/convert \
  -H "Content-Type: application/json" \
  -d '{"content": "这是测试", "preserveMarkdown": false}'
```

**Expected response**:
```json
{
  "convertedContent": "這是測試",
  "conversionStats": {
    "charactersConverted": 3,
    "processingTimeMs": 2,
    ...
  }
}
```

### Running the Frontend Locally

Serve the static frontend files:

```bash
cd converter-tool/frontend
npm run dev
```

**Expected output**:
```
Starting up http-server, serving public/
Available on:
  http://localhost:8080
```

**Open in browser**: [http://localhost:8080](http://localhost:8080)

**Configure API endpoint**: Edit `public/app.js` to point to local Worker:
```javascript
const API_URL = 'http://localhost:8787/api';
```

---

## Running Tests

### Worker Unit Tests

Test the core conversion logic:

```bash
cd converter-tool/worker
npm test
```

**Test coverage includes**:
- Character mapping accuracy (99.5%+ conversion rate)
- Markdown code block preservation
- File size validation
- Error handling (encoding, oversized files)

**Expected output**:
```
✓ src/converter.test.ts (10 tests)
  ✓ converts simple Simplified Chinese text
  ✓ preserves markdown code blocks
  ✓ handles mixed Simplified/Traditional text
  ...

Test Files  2 passed (2)
     Tests  15 passed (15)
  Duration  125ms
```

### Frontend E2E Tests

Test the complete user workflow:

```bash
cd converter-tool/frontend
npm test
```

**Test scenarios**:
- File upload and download
- Text paste and copy
- Batch conversion with zip download
- Error handling (file too large, network errors)

---

## Building for Production

### Build the Worker

Compile TypeScript to JavaScript and bundle dependencies:

```bash
cd converter-tool/worker
npm run build
```

**Output**: `dist/index.js` (bundled Worker script)

**Verify bundle size**:
```bash
ls -lh dist/index.js
# Should be <500KB
```

### Build the Frontend

Minify JavaScript and CSS:

```bash
cd converter-tool/frontend
npm run build
```

**Output**: `dist/` directory with optimized assets

---

## Deployment

### Deploy to Cloudflare Workers

#### 1. Authenticate with Cloudflare

```bash
cd converter-tool/worker
npx wrangler login
```

This opens a browser window for Cloudflare authentication.

#### 2. Configure Wrangler

Edit `wrangler.toml`:
```toml
name = "chinese-converter"
main = "dist/index.js"
compatibility_date = "2025-10-11"

[env.production]
route = "converter.example.com/api/*"
```

#### 3. Deploy Worker

```bash
npm run deploy
```

**Expected output**:
```
✨ Uploaded chinese-converter (0.45 sec)
✨ Published chinese-converter (0.23 sec)
  https://chinese-converter.your-subdomain.workers.dev
```

**Test production Worker**:
```bash
curl -X POST https://chinese-converter.your-subdomain.workers.dev/api/convert \
  -H "Content-Type: application/json" \
  -d '{"content": "测试"}'
```

### Deploy to Cloudflare Pages

#### 1. Link Repository to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Click "Create a project"
3. Connect your GitHub repository
4. Select the `002-cloudflare-worker` branch

#### 2. Configure Build Settings

- **Build command**: `cd converter-tool/frontend && npm run build`
- **Build output directory**: `converter-tool/frontend/dist`
- **Root directory**: `/`

#### 3. Add Environment Variables

- `API_URL`: `https://chinese-converter.your-subdomain.workers.dev/api`

#### 4. Deploy

Cloudflare Pages auto-deploys on every push to `002-cloudflare-worker` branch.

**Access your site**: `https://your-project.pages.dev`

---

## Configuration

### Character Mapping Customization

The character mapping is stored in `worker/src/mappings/sc-to-tc.ts`:

```typescript
export const characterMapping: Record<string, string> = {
  '简体': '繁體',
  '文档': '文件',
  // Add custom mappings here
};
```

**To add new mappings**:
1. Edit `sc-to-tc.ts` and add entries
2. Rebuild Worker: `npm run build`
3. Redeploy: `npm run deploy`

**Extracting from Python script**:
```bash
# Convert Python dict to TypeScript
python3 tools/extract-mapping.py docs/backend/convert_tc.py > worker/src/mappings/sc-to-tc.ts
```

### Rate Limiting

Enable rate limiting in `wrangler.toml`:

```toml
[env.production.rate_limiting]
enabled = true
limit = 100  # requests per minute per IP
```

### Custom Domain

1. Add domain in Cloudflare Dashboard → Pages → Custom domains
2. Update `API_URL` in frontend to use custom domain
3. Redeploy frontend

---

## Troubleshooting

### Worker Deploy Fails: "Script too large"

**Problem**: Worker bundle exceeds 1MB limit

**Solution**:
1. Check bundle size: `ls -lh dist/index.js`
2. Remove unused character mappings
3. Enable tree-shaking in build config

### Frontend Can't Connect to Worker

**Problem**: CORS error in browser console

**Solution**:
1. Add CORS headers in Worker `src/index.ts`:
   ```typescript
   headers: {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'POST, OPTIONS',
   }
   ```
2. Redeploy Worker

### Tests Fail: "Module not found"

**Problem**: Missing dependencies

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm test
```

### Conversion Accuracy Issues

**Problem**: Some characters not converting correctly

**Solution**:
1. Check if characters exist in mapping: `grep '字符' worker/src/mappings/sc-to-tc.ts`
2. Add missing mappings to dictionary
3. Run tests to verify: `npm test -- --grep 'character conversion'`

---

## Development Workflow

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b fix/improve-conversion-accuracy
   ```

2. **Make changes to code**:
   - Edit `worker/src/converter.ts` for conversion logic
   - Edit `frontend/public/app.js` for UI changes

3. **Run tests**:
   ```bash
   cd worker && npm test
   cd ../frontend && npm test
   ```

4. **Test locally**:
   ```bash
   # Terminal 1: Start Worker
   cd worker && npm run dev

   # Terminal 2: Start Frontend
   cd frontend && npm run dev
   ```

5. **Commit and push**:
   ```bash
   git add .
   git commit -m "fix: improve conversion accuracy for technical terms"
   git push origin fix/improve-conversion-accuracy
   ```

6. **Create Pull Request** and wait for CI/CD to run tests

### CI/CD Pipeline

GitHub Actions automatically:
1. Runs all tests on every PR
2. Deploys to preview environment (Cloudflare Pages preview)
3. Deploys to production on merge to `main`

**View pipeline**: `.github/workflows/deploy.yml`

---

## Next Steps

- **Add custom character mappings**: See [Configuration](#configuration)
- **Customize UI**: Edit `frontend/public/index.html` and `styles.css`
- **Enable analytics**: Add Cloudflare Web Analytics to frontend
- **Set up monitoring**: Use Cloudflare Workers Analytics dashboard

---

## Resources

- **Cloudflare Workers Docs**: [https://developers.cloudflare.com/workers/](https://developers.cloudflare.com/workers/)
- **Wrangler CLI Docs**: [https://developers.cloudflare.com/workers/wrangler/](https://developers.cloudflare.com/workers/wrangler/)
- **Vitest Docs**: [https://vitest.dev/](https://vitest.dev/)
- **Project Spec**: [spec.md](spec.md)
- **API Contract**: [contracts/api-spec.yaml](contracts/api-spec.yaml)

---

## Support

- **Issues**: Open a GitHub issue for bugs or feature requests
- **Questions**: Contact the team via Slack #converter-tool channel
- **Security**: Report security issues to security@example.com
