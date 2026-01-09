# Research & Technical Decisions

**Feature**: Django REST Framework Backend API Documentation
**Date**: 2025-10-11
**Status**: Complete

## Overview

This document captures all technical research and decisions for creating comprehensive Django REST Framework documentation targeted at Node.js developers. Since this is a documentation feature rather than a code implementation, the research focuses on documentation structure, pedagogical approaches, and content organization.

## Decision 1: Documentation Structure for Node.js Developers

**Decision**: Organize documentation as a progressive learning path with explicit Node.js/Express comparisons

**Rationale**:
- Target audience has zero Python/Django experience but strong Node.js background
- Leveraging existing knowledge accelerates learning
- Side-by-side comparisons reduce cognitive load
- Progressive disclosure prevents information overload

**Alternatives Considered**:

1. **Traditional Django tutorial approach** (Rejected)
   - Assumes no prior web development experience
   - Too basic for experienced Node.js developers
   - Would waste time on concepts they already understand (HTTP, REST, MVC patterns)

2. **Django-only documentation without comparisons** (Rejected)
   - Requires readers to make mental mappings themselves
   - Higher cognitive load
   - Misses opportunity to leverage existing knowledge

3. **Chosen: Comparison-based progressive learning**
   - Start with concept mapping (Express → Django equivalents)
   - Build on familiar patterns (middleware, routing, ORM)
   - Provide "translation tables" for quick reference

**Implementation Notes**:
- Each major concept includes a comparison table
- Code examples shown in both JavaScript and Python
- Common patterns mapped explicitly (e.g., "Express middleware = Django middleware")

---

## Decision 2: Documentation File Organization

**Decision**: Create separate focused documents for each learning stage, organized numerically

**Rationale**:
- Allows developers to consume documentation in order or jump to specific topics
- Each file has a single responsibility
- Easy to maintain and update individual sections
- Numbered files (01-, 02-, etc.) indicate recommended reading order

**File Structure**:

1. `01-django-basics-for-nodejs-developers.md` (✅ Exists)
   - Python syntax quick start
   - Django vs Node.js concept mapping
   - Core framework patterns

2. `02-project-structure-and-planning.md` (✅ Exists)
   - Backend architecture design
   - Data models and relationships
   - API endpoint planning
   - Authentication strategy

3. `03-api-implementation-guide.md` (To be created)
   - Step-by-step API implementation
   - Serializers, views, URL routing
   - CRUD operations with examples

4. `04-deployment-guide.md` (To be created)
   - Environment setup
   - Production configuration
   - Cloud platform deployment (Railway/Heroku/DigitalOcean)
   - Security and performance optimization

5. `05-testing-guide.md` (To be created)
   - pytest and pytest-django setup
   - Unit, integration, and contract tests
   - Test patterns for Django/DRF

6. `06-frontend-integration.md` (To be created)
   - Connecting Next.js frontend to Django backend
   - JWT authentication flow
   - CORS configuration
   - API client setup in frontend

7. `README.md` (To be created)
   - Documentation index
   - Quick navigation
   - Prerequisites and getting started

**Alternatives Considered**:

1. **Single monolithic documentation file** (Rejected)
   - Too long and overwhelming
   - Difficult to navigate
   - Hard to update specific sections

2. **Wiki-style with many small pages** (Rejected)
   - Can fragment the learning path
   - Harder to maintain reading order
   - More overhead in navigation

---

## Decision 3: Data Model Documentation Approach

**Decision**: Use entity-relationship diagrams with both visual and code representations

**Rationale**:
- Visual diagrams help understand relationships at a glance
- Python model code shows practical implementation
- TypeScript interfaces show frontend integration
- Covers both backend and frontend perspectives

**Format**:
```
For each entity:
├── ER diagram showing relationships
├── Django model definition (Python)
├── TypeScript interface (frontend)
└── Explanation of relationships and constraints
```

**Data Models to Document**:

1. **User** (extends AbstractUser)
   - Fields: display_name, bio, avatar, climbing_start_year, frequent_gym, favorite_route_type, social_links
   - Relationships: OneToMany with Post, Gallery, Comment, Bookmark

2. **Post** (Blog articles)
   - Fields: title, slug, content, summary, cover_image, images, likes, views
   - Relationships: ManyToOne to User (author), ManyToMany with Tag

3. **Tag**
   - Fields: name, slug
   - Relationships: ManyToMany with Post

4. **Gym** (Climbing gym information)
   - Fields: name, slug, description, address, cover_image, images, website, phone, opening_hours, facilities, likes, rating
   - Relationships: Can have Comments

5. **Gallery** (Photo albums)
   - Fields: title, slug, description, cover_image, likes, views
   - Relationships: ManyToOne to User (author), OneToMany with Image

6. **Image** (Gallery photos)
   - Fields: url, caption, order
   - Relationships: ManyToOne to Gallery

7. **Comment** (Generic comments)
   - Fields: content, likes
   - Relationships: ManyToOne to User (author), GenericForeignKey to any model, self-referential for replies

8. **Video** (YouTube videos)
   - Fields: youtube_id, title, description, thumbnail_url, channel, published_at, duration, view_count, category, duration_category, tags, featured
   - Relationships: Standalone (no direct relationships, can be commented)

9. **Bookmark** (User saved items)
   - Fields: (uses GenericForeignKey)
   - Relationships: ManyToOne to User, GenericForeignKey to any model

**Alternatives Considered**:

1. **Code-only documentation** (Rejected)
   - Harder to grasp relationships visually
   - Requires reading through all models to understand structure

2. **Diagram-only documentation** (Rejected)
   - Missing implementation details
   - Doesn't show frontend integration

---

## Decision 4: API Endpoint Specification Format

**Decision**: Use OpenAPI 3.0 specification with detailed examples and response schemas

**Rationale**:
- Industry standard format
- Can generate interactive documentation (Swagger UI)
- Provides complete contract for frontend developers
- Machine-readable for code generation and validation

**Endpoint Categories**:

1. **Authentication** (`/api/v1/auth/`)
   - POST `/register/` - User registration
   - POST `/login/` - User login (returns JWT)
   - POST `/logout/` - User logout
   - POST `/refresh/` - Refresh access token
   - POST `/password/reset/` - Password reset request
   - POST `/password/change/` - Change password
   - GET `/me/` - Current user info

2. **Users** (`/api/v1/users/`)
   - Standard CRUD operations
   - GET `/:id/posts/` - User's posts
   - GET `/:id/galleries/` - User's galleries
   - GET `/:id/bookmarks/` - User's bookmarks

3. **Posts** (`/api/v1/posts/`)
   - Standard CRUD operations
   - POST `/:id/like/` - Like/unlike
   - GET `/:id/comments/` - Post comments

4. **Tags** (`/api/v1/tags/`)
   - GET `/` - List tags
   - GET `/:id/posts/` - Posts by tag

5. **Gyms** (`/api/v1/gyms/`)
   - Standard CRUD operations
   - POST `/:id/like/` - Like/unlike
   - GET `/:id/comments/` - Gym comments

6. **Galleries** (`/api/v1/galleries/`)
   - Standard CRUD operations
   - POST `/:id/images/` - Add image
   - DELETE `/:id/images/:img_id/` - Remove image

7. **Comments** (`/api/v1/comments/`)
   - Standard CRUD operations
   - POST `/:id/like/` - Like/unlike
   - GET `/:id/replies/` - Comment replies

8. **Videos** (`/api/v1/videos/`)
   - GET `/` - List videos (with filtering)
   - GET `/:id/` - Video details
   - GET `/featured/` - Featured videos

9. **Search** (`/api/v1/search/`)
   - GET `/?q=query&type=all|post|gym|gallery|user`

**Common Query Parameters**:
- Pagination: `?page=1&page_size=20`
- Filtering: `?author=1&tags=climbing,outdoor`
- Search: `?search=keyword`
- Ordering: `?ordering=-created_at`

**Alternatives Considered**:

1. **Simple endpoint list without schema** (Rejected)
   - Insufficient detail for frontend development
   - Ambiguous request/response formats

2. **GraphQL schema** (Rejected)
   - Adds complexity for Node.js developers learning Django
   - Django REST Framework is REST-focused
   - Can be added later as enhancement

---

## Decision 5: Deployment Platform Recommendations

**Decision**: Document deployment for Railway, Heroku, and DigitalOcean with Railway as primary

**Rationale**:
- Railway: Modern, developer-friendly, generous free tier, good for learning
- Heroku: Well-established, extensive documentation, good transition to production
- DigitalOcean: More control, cost-effective for production, Kubernetes option

**Deployment Guide Structure**:

1. **Development Environment Setup**
   - Python virtual environment (venv)
   - PostgreSQL installation (local or Docker)
   - Environment variables (.env)
   - Database migrations
   - Static file configuration

2. **Production Configuration**
   - Environment-specific settings (development/staging/production)
   - Security settings (SECRET_KEY, ALLOWED_HOSTS, HTTPS)
   - Database configuration (PostgreSQL connection)
   - Static files (WhiteNoise or cloud storage)
   - Media files (Cloudflare R2 or AWS S3)
   - CORS configuration for Next.js frontend

3. **Platform-Specific Deployment**

   **Railway** (Primary):
   - `railway.json` configuration
   - Environment variable setup
   - Database provisioning
   - Automatic deployment from Git
   - Custom domain setup

   **Heroku**:
   - `Procfile` configuration
   - Heroku Postgres addon
   - buildpack setup
   - Deploy via Git or CLI

   **DigitalOcean**:
   - App Platform deployment
   - Managed PostgreSQL
   - Dockerfile configuration (optional)
   - Load balancer setup

4. **Post-Deployment**
   - Database migrations
   - Superuser creation
   - Static file collection
   - Health checks
   - Monitoring and logging

**Alternatives Considered**:

1. **AWS/Azure focus** (Rejected)
   - Too complex for initial learning
   - Requires extensive cloud knowledge
   - Higher cost for small projects

2. **Self-hosted VPS** (Rejected)
   - Requires DevOps knowledge
   - More maintenance overhead
   - Security configuration complexity

---

## Decision 6: Authentication Strategy

**Decision**: JWT (JSON Web Token) authentication using djangorestframework-simplejwt

**Rationale**:
- Frontend already uses token-based auth (seen in Zustand store)
- Stateless authentication suitable for API-only backend
- Works well with Next.js frontend
- Industry standard for modern web apps
- Supports access/refresh token pattern

**Implementation Approach**:

1. **Token Management**
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (7 days)
   - Automatic token refresh on frontend
   - Secure storage in httpOnly cookies or localStorage

2. **Integration with Frontend**
   - Login endpoint returns access + refresh tokens
   - Frontend stores tokens in auth store (Zustand)
   - Include token in Authorization header: `Bearer <token>`
   - Automatic token refresh before expiry
   - Logout clears tokens

3. **Security Considerations**
   - HTTPS required in production
   - CORS properly configured
   - Token rotation on refresh
   - Blacklist for revoked tokens (optional)

**Alternatives Considered**:

1. **Session-based authentication** (Rejected)
   - Requires server state management
   - CSRF token complexity
   - Less suitable for separate frontend/backend

2. **OAuth2/Social auth** (Deferred)
   - Adds complexity for initial implementation
   - Can be added later as enhancement
   - Focus on core auth first

---

## Decision 7: Testing Strategy

**Decision**: pytest with pytest-django for comprehensive test coverage

**Rationale**:
- pytest is the industry standard for Python testing
- pytest-django provides Django-specific fixtures and helpers
- More Pythonic than Django's default unittest
- Better fixture management
- Clearer test output

**Test Types**:

1. **Unit Tests**
   - Model methods and properties
   - Serializer validation
   - Utility functions
   - Isolated business logic

2. **Integration Tests**
   - API endpoint functionality
   - Database operations
   - Authentication flow
   - Permission checks

3. **Contract Tests**
   - API response schemas match OpenAPI spec
   - Frontend TypeScript interfaces compatibility
   - Error response formats

**Test Organization**:
```
tests/
├── unit/
│   ├── test_models.py
│   ├── test_serializers.py
│   └── test_utils.py
├── integration/
│   ├── test_auth_api.py
│   ├── test_posts_api.py
│   └── test_users_api.py
└── contract/
    └── test_api_schemas.py
```

**Alternatives Considered**:

1. **Django's unittest framework** (Rejected)
   - More verbose
   - Less flexible fixtures
   - Not as widely used in modern Python development

2. **End-to-end tests with Selenium** (Deferred)
   - Focus on backend API testing first
   - E2E tests better suited for frontend project

---

## Decision 8: Frontend Integration Approach

**Decision**: Document clear API contract with TypeScript interfaces matching Django serializers

**Rationale**:
- Frontend is TypeScript-based (Next.js with strict typing)
- Type safety ensures API contract compliance
- Reduces integration bugs
- Enables frontend development before backend completion

**Integration Points**:

1. **Type Definitions**
   ```typescript
   // Generated from Django serializers
   interface User {
     id: string;
     username: string;
     email: string;
     displayName?: string;
     // ... matches Django User serializer
   }
   ```

2. **API Client**
   - Axios already configured in frontend
   - Add Django backend base URL
   - Token interceptor for JWT
   - Error handling for Django error format

3. **State Management**
   - Zustand stores already exist (authStore, contentStore)
   - Add API integration to existing stores
   - TanStack Query for server state and caching

4. **CORS Configuration**
   ```python
   # Django settings
   CORS_ALLOWED_ORIGINS = [
     "http://localhost:3000",  # Next.js dev
     "https://nobodyclimb.cc", # Frontend production
   ]
   ```

**Documentation Will Cover**:
- Setting up API client in Next.js
- Configuring JWT token management
- Mapping Django responses to TypeScript types
- Error handling patterns
- TanStack Query integration examples

**Alternatives Considered**:

1. **GraphQL with code generation** (Rejected)
   - Adds complexity for initial implementation
   - REST is simpler for Django + Next.js
   - Can be added later if needed

2. **Separate API gateway** (Rejected)
   - Unnecessary complexity for current scale
   - Direct Django to Next.js communication is sufficient

---

## Decision 9: Documentation Language and Localization

**Decision**: Primary documentation in English with Chinese technical term translations

**Rationale**:
- User's initial request was in Chinese, indicating Chinese-speaking developer
- English is standard for technical documentation and code
- Bilingual approach supports both Chinese developers and international collaboration
- Technical terms remain in English (Django, REST, JWT) for consistency with official docs

**Approach**:

1. **Code Examples**: English (standard)
   - Variable names, comments in English
   - Follows Django/Python conventions

2. **Explanatory Text**: English primary with Chinese sections where helpful
   - Complex concepts explained in both languages
   - Quick reference tables in both languages
   - Chinese translations for key terms and workflows

3. **Technical Terms**: English with Chinese in parentheses first mention
   - Example: "Serializer (序列化器)"
   - Subsequent mentions in English only

**Alternatives Considered**:

1. **English only** (Rejected)
   - User requested Chinese support
   - May slow learning for Chinese speakers

2. **Chinese only** (Rejected)
   - Inconsistent with code and official docs
   - Harder to reference official Django documentation

---

## Technology Stack Summary

### Documentation Stack
- **Format**: Markdown
- **Diagrams**: Mermaid for ER diagrams (if needed)
- **API Spec**: OpenAPI 3.0 (YAML)
- **Code Examples**: Python 3.11+, JavaScript/TypeScript

### Target Backend Stack (Documented)
- **Language**: Python 3.11+
- **Framework**: Django 5.0+
- **API Framework**: Django REST Framework 3.14+
- **Database**: PostgreSQL 15
- **Authentication**: djangorestframework-simplejwt
- **Testing**: pytest + pytest-django
- **Server**: Gunicorn (WSGI)
- **Storage**: Cloudflare R2 or AWS S3 (media files)
- **Deployment**: Railway (primary), Heroku, DigitalOcean (alternatives)

### Frontend Integration (Existing)
- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript 5.9
- **State Management**: Zustand 4.5
- **Data Fetching**: TanStack Query 5.85
- **HTTP Client**: Axios 1.11
- **Deployment**: Cloudflare Workers

---

## Open Questions & Future Enhancements

### Resolved in This Phase
- ✅ Documentation structure and organization
- ✅ Target audience approach (Node.js developers)
- ✅ Data model design
- ✅ API endpoint specification
- ✅ Authentication strategy
- ✅ Deployment platform recommendations
- ✅ Testing approach
- ✅ Frontend integration approach

### Future Enhancements (Out of Scope)
- Advanced caching with Redis
- Real-time features (WebSockets)
- Social authentication (OAuth)
- Elasticsearch for advanced search
- CI/CD pipeline automation
- Performance profiling and optimization
- Multi-language content support

---

## References

### Official Documentation
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django REST Framework SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [pytest Documentation](https://docs.pytest.org/)
- [OpenAPI Specification](https://swagger.io/specification/)

### Existing Project Resources
- Frontend TypeScript types: `src/lib/types/`
- Frontend API client: `src/lib/api/`
- Frontend auth store: `src/store/authStore.ts`
- Existing backend docs: `docs/backend/01-django-basics-for-nodejs-developers.md`
- Existing backend docs: `docs/backend/02-project-structure-and-planning.md`

---

## Conclusion

All technical decisions for the Django REST Framework documentation feature have been researched and documented. The documentation will be structured as a progressive learning path for Node.js developers, with clear comparisons to familiar Express.js patterns. The comprehensive documentation suite will cover Django basics, architecture planning, implementation, testing, deployment, and frontend integration.

**Next Phase**: Generate data-model.md and API contracts based on these research findings.
