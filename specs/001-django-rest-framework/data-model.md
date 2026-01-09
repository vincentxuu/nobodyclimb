# Data Model Specification

**Feature**: Django REST Framework Backend API
**Date**: 2025-10-11
**Status**: Complete

## Overview

This document defines all data models for the NobodyClimb climbing community backend API. The models support user management, content creation (posts, galleries), climbing gym information, video integration, and social features (comments, bookmarks).

## Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    User     │────┬───→│    Post     │←────────│   Comment   │
│   (Auth)    │    │    │  (Content)  │         │  (Social)   │
└─────────────┘    │    └─────────────┘         └─────────────┘
       │           │            │                       │
       │           │            ↓                       │
       │           │    ┌─────────────┐                │
       │           │    │     Tag     │                │
       │           │    │ (Taxonomy)  │                │
       │           │    └─────────────┘                │
       │           │                                    │
       │           │    ┌─────────────┐                │
       │           ├───→│     Gym     │←───────────────┘
       │           │    │   (Place)   │
       │           │    └─────────────┘
       │           │
       │           │    ┌─────────────┐
       │           └───→│   Gallery   │
       │                │   (Album)   │
       │                └─────────────┘
       │                        │
       │                        ↓
       │                ┌─────────────┐
       │                │    Image    │
       │                │   (Media)   │
       │                └─────────────┘
       │
       ↓
┌─────────────┐         ┌─────────────┐
│  Bookmark   │         │    Video    │
│  (Saved)    │         │  (YouTube)  │
└─────────────┘         └─────────────┘
```

**Legend**:
- `─→` : One-to-Many relationship
- `←─` : Foreign Key reference
- `↓` : Many-to-Many relationship

---

## Model Definitions

### 1. User (Authentication & Profile)

**Purpose**: Extended user model with climbing-specific profile information

**Fields**:

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| id | AutoField (PK) | Yes | Primary key |
| username | CharField(150) | Yes | Unique login username |
| email | EmailField | Yes | User email address |
| password | CharField(128) | Yes | Hashed password |
| display_name | CharField(100) | No | Public display name |
| bio | TextField | No | User biography |
| avatar | URLField | No | Profile avatar URL |
| climbing_start_year | CharField(4) | No | Year started climbing |
| frequent_gym | CharField(200) | No | Frequently visited gym |
| favorite_route_type | CharField(50) | No | Preferred climbing style |
| social_links | JSONField | No | Social media links (dict) |
| is_active | BooleanField | Yes | Account active status |
| is_staff | BooleanField | Yes | Admin access flag |
| created_at | DateTimeField | Yes | Account creation timestamp |
| updated_at | DateTimeField | Yes | Last update timestamp |

**Relationships**:
- OneToMany → Post (author)
- OneToMany → Gallery (author)
- OneToMany → Comment (author)
- OneToMany → Bookmark (user)

**Validation Rules**:
- username: 3-150 characters, alphanumeric + underscore
- email: valid email format, unique
- climbing_start_year: 4 digits, optional
- social_links format: `{"instagram": "url", "facebook": "url", "website": "url"}`

**Indexes**:
- Primary: id
- Unique: username, email
- Index: created_at (for sorting)

---

### 2. Post (Blog Content)

**Purpose**: User-created blog posts and articles about climbing

**Fields**:

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| id | AutoField (PK) | Yes | Primary key |
| title | CharField(200) | Yes | Post title |
| slug | SlugField(200) | Yes | URL-friendly identifier |
| content | TextField | Yes | Post content (Markdown) |
| summary | TextField(500) | Yes | Short description |
| cover_image | URLField | Yes | Cover image URL |
| images | JSONField | No | Additional images (array) |
| author_id | ForeignKey | Yes | Reference to User |
| likes | IntegerField | Yes | Like count (default: 0) |
| views | IntegerField | Yes | View count (default: 0) |
| is_published | BooleanField | Yes | Publication status |
| created_at | DateTimeField | Yes | Creation timestamp |
| updated_at | DateTimeField | Yes | Last update timestamp |

**Relationships**:
- ManyToOne → User (author)
- ManyToMany ↔ Tag (tags)
- GenericRelation ← Comment (via ContentType)

**Validation Rules**:
- title: 1-200 characters, required
- slug: auto-generated from title, unique
- summary: max 500 characters
- images format: `["url1", "url2", "url3"]`
- likes/views: non-negative integers

**Indexes**:
- Primary: id
- Unique: slug
- Index: (author_id, -created_at)
- Index: (is_published, -created_at)
- Index: -created_at

---

### 3. Tag (Taxonomy)

**Purpose**: Categorization and tagging system for posts

**Fields**:

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| id | AutoField (PK) | Yes | Primary key |
| name | CharField(50) | Yes | Tag name |
| slug | SlugField(50) | Yes | URL-friendly identifier |
| created_at | DateTimeField | Yes | Creation timestamp |

**Relationships**:
- ManyToMany ↔ Post (posts)

**Validation Rules**:
- name: 1-50 characters, unique
- slug: auto-generated from name, unique

**Indexes**:
- Primary: id
- Unique: name, slug

---

### 4. Gym (Climbing Venue)

**Purpose**: Information about climbing gyms and facilities

**Fields**:

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| id | AutoField (PK) | Yes | Primary key |
| name | CharField(200) | Yes | Gym name |
| slug | SlugField(200) | Yes | URL-friendly identifier |
| description | TextField | Yes | Gym description |
| address | CharField(500) | Yes | Physical address |
| cover_image | URLField | Yes | Cover image URL |
| images | JSONField | No | Additional images (array) |
| website | URLField | No | Official website |
| phone | CharField(20) | No | Contact phone |
| opening_hours | JSONField | No | Operating hours (dict) |
| facilities | JSONField | No | Available facilities (array) |
| likes | IntegerField | Yes | Like count (default: 0) |
| rating | DecimalField(3,2) | Yes | Average rating (default: 0) |
| created_at | DateTimeField | Yes | Creation timestamp |
| updated_at | DateTimeField | Yes | Last update timestamp |

**Relationships**:
- GenericRelation ← Comment (via ContentType)

**Validation Rules**:
- name: 1-200 characters, required
- slug: auto-generated from name, unique
- phone: optional, format validation
- opening_hours format: `{"monday": "10:00-22:00", "tuesday": "10:00-22:00", ...}`
- facilities format: `["shower", "locker", "cafe", "rental"]`
- rating: 0.00 to 5.00

**Indexes**:
- Primary: id
- Unique: slug
- Index: -created_at
- Index: -rating

---

### 5. Gallery (Photo Album)

**Purpose**: User-created photo albums of climbing experiences

**Fields**:

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| id | AutoField (PK) | Yes | Primary key |
| title | CharField(200) | Yes | Gallery title |
| slug | SlugField(200) | Yes | URL-friendly identifier |
| description | TextField | No | Gallery description |
| cover_image | URLField | Yes | Cover image URL |
| author_id | ForeignKey | Yes | Reference to User |
| likes | IntegerField | Yes | Like count (default: 0) |
| views | IntegerField | Yes | View count (default: 0) |
| created_at | DateTimeField | Yes | Creation timestamp |
| updated_at | DateTimeField | Yes | Last update timestamp |

**Relationships**:
- ManyToOne → User (author)
- OneToMany → Image (images)
- GenericRelation ← Comment (via ContentType)

**Validation Rules**:
- title: 1-200 characters, required
- slug: auto-generated from title, unique
- likes/views: non-negative integers

**Indexes**:
- Primary: id
- Unique: slug
- Index: (author_id, -created_at)
- Index: -created_at

---

### 6. Image (Gallery Photo)

**Purpose**: Individual photos within a gallery

**Fields**:

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| id | AutoField (PK) | Yes | Primary key |
| gallery_id | ForeignKey | Yes | Reference to Gallery |
| url | URLField | Yes | Image URL |
| caption | CharField(500) | No | Image caption |
| order | IntegerField | Yes | Display order (default: 0) |
| created_at | DateTimeField | Yes | Creation timestamp |

**Relationships**:
- ManyToOne → Gallery (gallery)

**Validation Rules**:
- url: valid URL, required
- caption: max 500 characters
- order: non-negative integer for sorting

**Indexes**:
- Primary: id
- Index: (gallery_id, order, created_at)

---

### 7. Comment (Social Interaction)

**Purpose**: Comments on posts, gyms, galleries, and other content

**Fields**:

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| id | AutoField (PK) | Yes | Primary key |
| content | TextField | Yes | Comment text |
| author_id | ForeignKey | Yes | Reference to User |
| content_type_id | ForeignKey | Yes | ContentType reference |
| object_id | CharField(50) | Yes | Referenced object ID |
| parent_id | ForeignKey | No | Reply to comment |
| likes | IntegerField | Yes | Like count (default: 0) |
| created_at | DateTimeField | Yes | Creation timestamp |
| updated_at | DateTimeField | Yes | Last update timestamp |

**Relationships**:
- ManyToOne → User (author)
- GenericForeignKey → * (content_object: Post/Gym/Gallery)
- Self-referential → Comment (parent, for replies)
- OneToMany → Comment (replies)

**Validation Rules**:
- content: 1-5000 characters, required
- parent: can only reply to top-level or 1-level deep comments
- likes: non-negative integer

**Indexes**:
- Primary: id
- Index: (content_type_id, object_id)
- Index: (author_id, -created_at)
- Index: -created_at

---

### 8. Video (YouTube Integration)

**Purpose**: YouTube video catalog for climbing content

**Fields**:

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| id | AutoField (PK) | Yes | Primary key |
| youtube_id | CharField(50) | Yes | YouTube video ID |
| title | CharField(300) | Yes | Video title |
| description | TextField | Yes | Video description |
| thumbnail_url | URLField | Yes | Thumbnail image URL |
| channel | CharField(200) | Yes | Channel name |
| channel_id | CharField(50) | No | Channel ID |
| published_at | DateTimeField | Yes | YouTube publish date |
| duration | CharField(20) | Yes | Video duration (MM:SS) |
| view_count | CharField(50) | Yes | View count |
| category | CharField(20) | Yes | Video category |
| duration_category | CharField(10) | Yes | Length category |
| tags | JSONField | No | Video tags (array) |
| featured | BooleanField | Yes | Featured status |
| created_at | DateTimeField | Yes | Import timestamp |
| updated_at | DateTimeField | Yes | Last update timestamp |

**Relationships**:
- GenericRelation ← Comment (via ContentType)

**Validation Rules**:
- youtube_id: unique, required
- category: choices = ['outdoor', 'indoor', 'competition', 'bouldering', 'tutorial', 'documentary', 'gear']
- duration_category: choices = ['short' (<5min), 'medium' (5-20min), 'long' (>20min)]
- tags format: `["tag1", "tag2", "tag3"]`

**Indexes**:
- Primary: id
- Unique: youtube_id
- Index: -published_at
- Index: category
- Index: featured

---

### 9. Bookmark (User Saved Items)

**Purpose**: User's saved/bookmarked content for later reference

**Fields**:

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| id | AutoField (PK) | Yes | Primary key |
| user_id | ForeignKey | Yes | Reference to User |
| content_type_id | ForeignKey | Yes | ContentType reference |
| object_id | CharField(50) | Yes | Referenced object ID |
| created_at | DateTimeField | Yes | Bookmark timestamp |

**Relationships**:
- ManyToOne → User (user)
- GenericForeignKey → * (content_object: Post/Gym/Gallery/Video)

**Validation Rules**:
- Unique constraint: (user_id, content_type_id, object_id)
- Users cannot bookmark the same item twice

**Indexes**:
- Primary: id
- Unique: (user_id, content_type_id, object_id)
- Index: (user_id, -created_at)

---

## Relationship Summary

### One-to-Many Relationships

1. **User → Post**: One user can create many posts
2. **User → Gallery**: One user can create many galleries
3. **User → Comment**: One user can write many comments
4. **User → Bookmark**: One user can bookmark many items
5. **Gallery → Image**: One gallery contains many images
6. **Comment → Comment** (Self): One comment can have many replies

### Many-to-Many Relationships

1. **Post ↔ Tag**: Posts can have multiple tags, tags can be on multiple posts

### Generic Relationships (Polymorphic)

1. **Comment → ***: Comments can be attached to Post, Gym, Gallery, Video
2. **Bookmark → ***: Bookmarks can save Post, Gym, Gallery, Video

---

## Database Constraints

### Primary Keys
- All models use auto-incrementing integer primary keys
- Exposed as string IDs in API for consistency with frontend

### Unique Constraints
- User: username, email
- Post: slug
- Tag: name, slug
- Gym: slug
- Gallery: slug
- Video: youtube_id
- Bookmark: (user_id, content_type_id, object_id)

### Foreign Key Constraints
- ON DELETE CASCADE: Comments deleted when parent is deleted
- ON DELETE CASCADE: Images deleted when gallery is deleted
- ON DELETE CASCADE: Bookmarks deleted when user is deleted
- ON DELETE CASCADE: User-created content deleted when user is deleted

### Check Constraints
- likes, views: >= 0
- rating: >= 0 AND <= 5.00
- order: >= 0

---

## JSON Field Schemas

### User.social_links
```json
{
  "instagram": "https://instagram.com/username",
  "facebook": "https://facebook.com/username",
  "twitter": "https://twitter.com/username",
  "website": "https://example.com"
}
```

### Post.images / Gym.images
```json
[
  "https://cdn.example.com/image1.jpg",
  "https://cdn.example.com/image2.jpg",
  "https://cdn.example.com/image3.jpg"
]
```

### Gym.opening_hours
```json
{
  "monday": "10:00-22:00",
  "tuesday": "10:00-22:00",
  "wednesday": "10:00-22:00",
  "thursday": "10:00-22:00",
  "friday": "10:00-23:00",
  "saturday": "09:00-23:00",
  "sunday": "09:00-21:00"
}
```

### Gym.facilities
```json
[
  "shower",
  "locker",
  "cafe",
  "equipment_rental",
  "parking",
  "wifi"
]
```

### Video.tags
```json
[
  "bouldering",
  "outdoor",
  "tutorial",
  "V10"
]
```

---

## TypeScript Interface Mapping

For frontend integration, Django models map to TypeScript interfaces:

```typescript
// User model → User interface
interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  climbingStartYear?: string;
  frequentGym?: string;
  favoriteRouteType?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Post model → Post interface
interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  coverImage: string;
  images?: string[];
  author: User;
  tags: Tag[];
  likes: number;
  views: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ... (similar mappings for all models)
```

**Naming Convention**:
- Django: snake_case (Python convention)
- TypeScript: camelCase (JavaScript convention)
- Serializers handle automatic conversion

---

## Data Model Evolution

### Version 1.0 (Current Scope)
- All models defined above
- Basic relationships and constraints
- JSON fields for flexible data

### Future Enhancements (Out of Scope)
- Notification model for user alerts
- Activity model for user action feed
- Location model for GPS coordinates
- Route model for specific climbing routes
- Achievement model for gamification
- Follow/Follower relationships
- Private messaging system

---

## Database Migration Strategy

### Initial Migration
1. Create User model (extends Django AbstractUser)
2. Create independent models (Tag, Video)
3. Create models with FK to User (Post, Gallery, Gym)
4. Create dependent models (Image, Comment, Bookmark)
5. Create many-to-many relationships (Post-Tag)

### Data Seeding
- Admin superuser creation
- Sample tags (outdoor, indoor, bouldering, sport, trad)
- Sample gyms from existing frontend data
- YouTube video data import from existing JSON

### Testing Data
- Factory patterns for each model
- Realistic test data generation
- Relationship integrity validation

---

## Conclusion

This data model provides a complete foundation for the NobodyClimb climbing community platform. All models support the features defined in the specification:
- ✅ User authentication and profiles
- ✅ Content creation (posts, galleries)
- ✅ Climbing gym information
- ✅ Social features (comments, likes, bookmarks)
- ✅ YouTube video integration
- ✅ Search and filtering support

**Next Step**: Generate API contracts in `/contracts/` directory based on these models.
