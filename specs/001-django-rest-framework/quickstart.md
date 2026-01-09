# Django REST Framework Quickstart Guide

**For Node.js Developers** | **Last Updated**: 2025-10-11

This quickstart guide will help you set up and run your first Django REST Framework API in under 30 minutes. If you're coming from Node.js/Express, this guide highlights familiar concepts and gets you productive quickly.

---

## Prerequisites

- **Python 3.11+** installed ([Download](https://www.python.org/downloads/))
- **Node.js experience** (Express.js knowledge helpful)
- **Basic command line** familiarity
- **PostgreSQL** installed locally or Docker ([Download](https://www.postgresql.org/download/))

**Quick Check**:
```bash
python3 --version  # Should show 3.11 or higher
pip3 --version     # Python package manager (like npm)
psql --version     # PostgreSQL client
```

---

## 🚀 Quick Start (5 Minutes)

### 1. Create Project Directory

```bash
mkdir nobodyclimb-backend
cd nobodyclimb-backend
```

### 2. Set Up Virtual Environment

**What is this?** Python's virtual environment is like `node_modules` but for the entire project's Python packages.

```bash
# Create virtual environment (like npm init)
python3 -m venv venv

# Activate it (you'll do this every time you work on the project)
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

# You should see (venv) in your terminal prompt now
```

**Node.js Equivalent**:
```javascript
// Node.js: packages in node_modules/
npm install express

// Python: packages in venv/lib/python3.11/site-packages/
pip install django
```

### 3. Install Django & Dependencies

```bash
# Create requirements.txt (like package.json)
cat > requirements.txt << EOF
Django==5.0.1
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.1
psycopg2-binary==2.9.9
python-decouple==3.8
django-cors-headers==4.3.1
Pillow==10.2.0
gunicorn==21.2.0
EOF

# Install all packages (like npm install)
pip install -r requirements.txt
```

**Comparison**:
| Node.js | Python/Django |
|---------|---------------|
| `package.json` | `requirements.txt` |
| `npm install` | `pip install` |
| `node_modules/` | `venv/lib/` |
| `npm run dev` | `python manage.py runserver` |

### 4. Create Django Project

```bash
# Create project (like express-generator)
django-admin startproject config .

# Note the "." at the end - creates project in current directory
# This creates:
# - manage.py (like package.json scripts)
# - config/ (project settings)
```

**Directory Structure Created**:
```
nobodyclimb-backend/
├── venv/                 # Virtual environment (like node_modules)
├── config/               # Project settings
│   ├── __init__.py
│   ├── settings.py       # Like .env + config files
│   ├── urls.py           # Like Express routes/router
│   ├── asgi.py          # Async server config
│   └── wsgi.py          # Server config (like server.js)
├── manage.py            # CLI tool (like npm scripts)
└── requirements.txt     # Dependencies (like package.json)
```

### 5. Create Your First App

**Django Concept**: In Django, a "project" contains multiple "apps". Each app is like a feature module.

```bash
# Create "api" app (like creating a routes/api folder)
python manage.py startapp api
```

**What's an App?** Think of it like organizing Express routes:
```javascript
// Node.js Express structure
src/
├── users/         # User-related routes
├── posts/         # Post-related routes
└── auth/          # Auth-related routes

// Django structure
project/
├── users/         # User app (models + views + serializers)
├── posts/         # Post app
└── auth/          # Auth app
```

### 6. Configure Database

Create `.env` file (like in Node.js):
```bash
cat > .env << EOF
SECRET_KEY=your-secret-key-change-in-production
DEBUG=True
DATABASE_URL=postgresql://localhost/nobodyclimb
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
EOF
```

Create PostgreSQL database:
```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE nobodyclimb;

# Exit
\q
```

### 7. Configure Settings

Edit `config/settings.py` (this is like your Express app configuration):

```python
# Add to INSTALLED_APPS (like registering middleware/routers)
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party apps
    'rest_framework',
    'corsheaders',
    # Your apps
    'api',
]

# Add CORS middleware (like app.use(cors()) in Express)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Add this
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS settings (like cors() options in Express)
from decouple import config
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='').split(',')

# Database configuration (like Sequelize/TypeORM config)
import dj_database_url
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600
    )
}
```

### 8. Run Migrations

**What are migrations?** Like database schema version control (similar to Prisma migrate or TypeORM migrations).

```bash
# Create initial database tables (like running Prisma migrate)
python manage.py migrate

# You should see:
# Running migrations:
#   Applying contenttypes.0001_initial... OK
#   Applying auth.0001_initial... OK
#   ...
```

### 9. Create Superuser

```bash
# Create admin user (like creating first user in your app)
python manage.py createsuperuser

# Follow prompts:
# Username: admin
# Email: admin@nobodyclimb.com
# Password: (enter password)
```

### 10. Run Development Server

```bash
# Start server (like npm run dev)
python manage.py runserver

# Server runs at http://127.0.0.1:8000/
# Admin panel at http://127.0.0.1:8000/admin/
```

**Visit**: `http://127.0.0.1:8000/admin/` and log in with your superuser credentials!

---

## 🎯 Your First API Endpoint (10 Minutes)

Let's create a simple "Hello World" API endpoint to understand the Django REST Framework workflow.

### 1. Create a Serializer

**What's a Serializer?** Like Zod/Joi validators + JSON transformers in Node.js.

Create `api/serializers.py`:
```python
from rest_framework import serializers

class HelloSerializer(serializers.Serializer):
    """Simple serializer for hello endpoint"""
    message = serializers.CharField(max_length=200)
    timestamp = serializers.DateTimeField()
    user = serializers.CharField(max_length=100, required=False)
```

**Node.js Equivalent**:
```javascript
// Express with Zod
import { z } from 'zod';

const HelloSchema = z.object({
  message: z.string().max(200),
  timestamp: z.date(),
  user: z.string().max(100).optional()
});
```

### 2. Create a View

**What's a View?** Like Express route handlers/controllers.

Edit `api/views.py`:
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from .serializers import HelloSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def hello_world(request):
    """Simple hello world endpoint"""
    data = {
        'message': 'Hello from Django REST Framework!',
        'timestamp': datetime.now(),
        'user': request.user.username if request.user.is_authenticated else 'Anonymous'
    }

    serializer = HelloSerializer(data)
    return Response(serializer.data, status=status.HTTP_200_OK)
```

**Node.js Equivalent**:
```javascript
// Express route handler
app.get('/api/hello', (req, res) => {
  const data = {
    message: 'Hello from Express!',
    timestamp: new Date(),
    user: req.user?.username || 'Anonymous'
  };

  res.json(data);
});
```

### 3. Register URL Route

**What's a URL Pattern?** Like Express `app.get()` or router definitions.

Create `api/urls.py`:
```python
from django.urls import path
from .views import hello_world

urlpatterns = [
    path('hello/', hello_world, name='hello'),
]
```

**Node.js Equivalent**:
```javascript
// Express router
const router = express.Router();
router.get('/hello', helloWorld);

app.use('/api', router);  // Mounts at /api/hello
```

### 4. Include App URLs in Project

Edit `config/urls.py`:
```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('api.urls')),  # Include API routes
]
```

### 5. Test Your Endpoint

```bash
# Make sure server is running
python manage.py runserver

# In another terminal, test with curl:
curl http://127.0.0.1:8000/api/v1/hello/

# Response:
# {
#   "message": "Hello from Django REST Framework!",
#   "timestamp": "2025-10-11T10:30:00Z",
#   "user": "Anonymous"
# }
```

**Or visit in browser**: `http://127.0.0.1:8000/api/v1/hello/`

Django REST Framework provides a **browsable API** - a beautiful web interface to test your API!

---

## 📚 What You've Learned

### Django Concepts → Node.js Equivalents

| Django Concept | Node.js Equivalent | Purpose |
|----------------|-------------------|---------|
| **Virtual Environment** (`venv`) | `node_modules/` | Isolated dependencies |
| **manage.py** | `package.json` scripts | CLI commands |
| **settings.py** | Config files + `.env` | Application configuration |
| **urls.py** | Express Router | URL routing |
| **views.py** | Route handlers/controllers | Request handling |
| **models.py** | TypeORM/Prisma models | Database models |
| **serializers.py** | Zod/Joi + transformers | Validation + serialization |
| **migrations** | Prisma migrate / TypeORM migrations | Database schema versioning |
| **Django App** | Feature modules | Code organization |

### Key Django Commands

```bash
# Project Management
python manage.py runserver          # Start dev server (npm run dev)
python manage.py shell              # Interactive Python shell (node REPL)

# Database
python manage.py makemigrations     # Generate migrations (prisma migrate dev)
python manage.py migrate            # Apply migrations
python manage.py dbshell           # Open database shell

# User Management
python manage.py createsuperuser    # Create admin user
python manage.py changepassword     # Change user password

# Development
python manage.py check              # Check for issues
python manage.py test               # Run tests (npm test)
python manage.py collectstatic      # Collect static files (production)
```

---

## 🔥 Next Steps

Now that you have a working Django REST Framework setup, here's what to explore next:

### 1. **Learn Django Basics** (2-3 hours)
📖 Read: `docs/backend/01-django-basics-for-nodejs-developers.md`
- Python syntax for Node.js developers
- Django vs Express concept mapping
- ORM (like TypeORM/Sequelize)
- Middleware, authentication, and more

### 2. **Understand the Architecture** (1-2 hours)
📖 Read: `docs/backend/02-project-structure-and-planning.md`
- Complete data model design
- API endpoint planning
- Authentication strategy
- Database relationships

### 3. **Review API Contracts** (30 minutes)
📖 Read: `specs/001-django-rest-framework/contracts/openapi.yaml`
- Full OpenAPI 3.0 specification
- All endpoint definitions
- Request/response schemas
- Authentication flows

### 4. **Implement Full API** (Follow implementation guide)
📖 Coming soon: `docs/backend/03-api-implementation-guide.md`
- User authentication with JWT
- CRUD operations for all models
- File uploads (images)
- Search functionality
- Comments and likes

### 5. **Deploy to Production** (Follow deployment guide)
📖 Coming soon: `docs/backend/04-deployment-guide.md`
- Railway deployment (easiest)
- PostgreSQL setup
- Environment configuration
- Static files and media storage

### 6. **Connect Next.js Frontend** (Frontend integration)
📖 Coming soon: `docs/backend/06-frontend-integration.md`
- CORS configuration
- JWT authentication flow
- API client setup in Next.js
- TypeScript type integration

---

## 🆘 Common Issues & Solutions

### Issue 1: "Module not found" errors
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # You should see (venv) in prompt

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue 2: Database connection errors
```bash
# Check PostgreSQL is running
psql postgres -c "SELECT 1"

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Test connection
python manage.py dbshell
```

### Issue 3: Port already in use
```bash
# Run on different port
python manage.py runserver 8001

# Or kill process using port 8000
lsof -ti:8000 | xargs kill -9
```

### Issue 4: CORS errors from frontend
```python
# In config/settings.py, make sure:
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',  # Your Next.js dev server
]

# For development, you can temporarily use:
CORS_ALLOW_ALL_ORIGINS = True  # NEVER use in production!
```

---

## 📖 Additional Resources

### Official Documentation
- [Django Documentation](https://docs.djangoproject.com/) - Comprehensive Django guide
- [Django REST Framework](https://www.django-rest-framework.org/) - DRF documentation
- [Django REST Framework Tutorial](https://www.django-rest-framework.org/tutorial/quickstart/) - Official quickstart

### Recommended Reading (for Node.js developers)
- [Django for JavaScript Developers](https://www.valentinog.com/blog/django-rest-react/)
- [Python for Node.js Developers](https://www.rithmschool.com/courses/python-fundamentals-part-1)

### Project Documentation
- `/docs/backend/` - All backend documentation
- `/specs/001-django-rest-framework/` - Feature specifications
- `/specs/001-django-rest-framework/data-model.md` - Complete data models
- `/specs/001-django-rest-framework/contracts/openapi.yaml` - API specification

---

## 🎉 You're Ready!

You now have:
- ✅ Working Django REST Framework project
- ✅ Development server running
- ✅ Admin panel access
- ✅ Your first API endpoint
- ✅ Understanding of Django → Node.js equivalents

**What's Next?** Start building your NobodyClimb API by following the architecture planning documentation and implementing the data models!

---

**Questions or Issues?**
- Check the detailed documentation in `/docs/backend/`
- Review the data models in `/specs/001-django-rest-framework/data-model.md`
- Explore the API specification in `/specs/001-django-rest-framework/contracts/openapi.yaml`

**Happy Coding!** 🚀
