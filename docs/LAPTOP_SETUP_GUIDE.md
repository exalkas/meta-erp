# Laptop Setup Guide - Legal Practice CRM + ERP Platform

**Complete Development Environment Setup for Windows 11**

> **⚡ Quick Alternative**: For faster setup, use our [Docker Setup Guide](../DOCKER_SETUP.md) instead!  
> This manual setup is comprehensive but requires more time and dependencies.

---

## 🎯 **Overview**

This guide sets up a complete development environment for the metadata-driven legal practice CRM + ERP platform with:

- **Backend**: FastAPI + PostgreSQL + Redis + Poetry
- **Frontend**: Next.js + TypeScript + npm
- **Architecture**: Multi-tenant with metadata-driven UI
- **Development**: Hot reload, debugging, testing

---

## 📋 **Prerequisites Installation**

### **1. Install Required Software**

#### **Node.js & npm**

```powershell
# Download and install Node.js 18+ from https://nodejs.org/
# Verify installation
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
```

#### **Python & Poetry**

```powershell
# Install Python 3.11+ from https://python.org/downloads/
# Verify Python installation
python --version  # Should be 3.11 or higher

# Install Poetry for dependency management
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
# Add Poetry to PATH (restart terminal after)
```

#### **PostgreSQL**

```powershell
# Download and install PostgreSQL 16+ from https://www.postgresql.org/download/windows/
# During installation:
# - Set postgres user password (remember this!)
# - Default port: 5432
# - Install pgAdmin for database management

# Verify installation
psql --version  # Should be 16.x or higher
```

#### **Redis**

```powershell
# Option 1: Install Redis via Windows Subsystem for Linux (WSL)
wsl --install  # If WSL not already installed
wsl
sudo apt update
sudo apt install redis-server
redis-server --version

# Option 2: Use Redis Stack for Windows
# Download from https://redis.io/download/
```

#### **Git (if not already installed)**

```powershell
# Download from https://git-scm.com/download/win
git --version
```

---

## 🔧 **Project Setup**

### **1. Clone Repository**

```powershell
# Navigate to your development directory
cd C:\dev  # or your preferred location

# Clone the repository (replace with your actual repo URL)
git clone https://github.com/your-username/metadata-erp.git
cd metadata-erp

# Verify project structure
dir
# Should see: services/, packages/, apps/, data/, docs/, scripts/
```

---

## 🐘 **Database Setup**

### **1. Create Databases**

```powershell
# Open PostgreSQL command line
psql -U postgres

# Create databases (in psql)
CREATE DATABASE metadata_erp_master;
CREATE DATABASE metadata_erp_tenant_demo;

# Create application user
CREATE USER erp_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE metadata_erp_master TO erp_user;
GRANT ALL PRIVILEGES ON DATABASE metadata_erp_tenant_demo TO erp_user;

# Exit psql
\q
```

### **2. Configure Database Connections**

```powershell
# Create environment files for each service
# We'll do this in the next step
```

---

## ⚙️ **Environment Configuration**

### **1. Auth Service Environment**

```powershell
# Create services/auth/.env
cd services/auth
New-Item -ItemType File -Name ".env"
```

Add to `services/auth/.env`:

```env
# Database
DATABASE_URL=postgresql://erp_user:your_secure_password@localhost:5432/metadata_erp_master

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT Settings
JWT_SECRET_KEY=your-super-secret-jwt-key-here-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Security
SECRET_KEY=your-super-secret-key-here-change-in-production

# Environment
ENVIRONMENT=development
DEBUG=true

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]

# Port
PORT=8001
```

### **2. API Service Environment**

```powershell
# Create services/api/.env
cd ..\api
New-Item -ItemType File -Name ".env"
```

Add to `services/api/.env`:

```env
# Database - Master DB for metadata
DATABASE_URL=postgresql://erp_user:your_secure_password@localhost:5432/metadata_erp_master

# Tenant Database Template
TENANT_DB_TEMPLATE=postgresql://erp_user:your_secure_password@localhost:5432/metadata_erp_tenant_{tenant_id}

# Redis
REDIS_URL=redis://localhost:6379/1

# Auth Service
AUTH_SERVICE_URL=http://localhost:8001

# Environment
ENVIRONMENT=development
DEBUG=true

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]

# Port
PORT=8000

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
```

### **3. Frontend Environment**

```powershell
# Create apps/client/.env.local
cd ..\..\apps\client
New-Item -ItemType File -Name ".env.local"
```

Add to `apps/client/.env.local`:

```env
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AUTH_URL=http://localhost:8001

# Environment
NODE_ENV=development
NEXT_PUBLIC_ENV=development

# Default tenant for development
NEXT_PUBLIC_DEFAULT_TENANT_ID=demo-eshop-crm
```

---

## 📦 **Package Installation**

### **1. Install Backend Dependencies**

#### **Auth Service**

```powershell
cd services\auth

# Install Python dependencies
poetry install

# Verify installation
poetry show
```

#### **API Service**

```powershell
cd ..\api

# Install Python dependencies
poetry install

# Verify installation
poetry show
```

### **2. Install Frontend Dependencies**

```powershell
# Install all workspace dependencies from root
cd ..\..

# Install all npm dependencies
npm install

# Verify shared UI package
cd packages\shared\ui
npm run build

# Return to root
cd ..\..\..
```

---

## 🗄️ **Database Schema & Seeding**

### **1. Run Database Migrations**

```powershell
# Navigate to API service
cd services\api

# Activate Poetry environment
poetry shell

# Run Alembic migrations
alembic upgrade head

# Verify tables were created
psql -U erp_user -d metadata_erp_master -c "\dt"
```

### **2. Seed Initial Data**

```powershell
# Still in services/api with poetry shell active

# Run the master seeding script
python data/seed-scripts/seed_all.py

# Verify seeding
psql -U erp_user -d metadata_erp_master -c "SELECT * FROM tenants;"
psql -U erp_user -d metadata_erp_master -c "SELECT * FROM users LIMIT 5;"
psql -U erp_user -d metadata_erp_master -c "SELECT * FROM roles LIMIT 5;"
```

---

## 🚀 **Start Development Services**

### **1. Start Redis** (if using WSL)

```powershell
# In WSL terminal
wsl
sudo service redis-server start
redis-cli ping  # Should return PONG
exit
```

### **2. Start Backend Services**

```powershell
# Open Terminal 1: Auth Service
cd services\auth
poetry shell
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Open Terminal 2: API Service
cd services\api
poetry shell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### **3. Start Frontend**

```powershell
# Open Terminal 3: Frontend (from project root)
npm run dev:client

# Or if you prefer using the specific commands
cd apps\client
npm run dev
```

### **4. Alternative: Use NPM Scripts (from root)**

```powershell
# Start auth service
npm run dev:auth

# Start api service (in new terminal)
npm run dev:api

# Start client (in new terminal)
npm run dev:client
```

---

## ✅ **Verify Installation**

### **1. Check Services Are Running**

```powershell
# Test Auth Service
curl http://localhost:8001/health
# Should return: {"status": "healthy"}

# Test API Service
curl http://localhost:8000/health
# Should return: {"status": "healthy"}

# Test Frontend
# Open browser: http://localhost:3000
# Should see the application login page
```

### **2. Test Database Connections**

```powershell
# Test tenant API endpoint
curl http://localhost:8000/tenants
# Should return list of seeded tenants

# Test roles API
curl http://localhost:8000/roles/health
# Should return: {"status": "healthy"}
```

### **3. Test Authentication Flow**

```powershell
# Test login endpoint
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@demo.com", "password": ""}'
# Should return JWT tokens
```

---

## 🛠️ **Development Tools Setup**

### **1. Database Management**

```powershell
# pgAdmin should be installed with PostgreSQL
# Access via: http://localhost:5050 (or desktop app)
# Add server connection:
# Host: localhost
# Port: 5432
# Username: erp_user
# Password: your_secure_password
```

### **2. API Documentation**

```powershell
# FastAPI auto-generates docs
# Auth Service: http://localhost:8001/docs
# API Service: http://localhost:8000/docs
```

### **3. Redis Monitoring**

```powershell
# Redis CLI
redis-cli
monitor  # Watch real-time commands
keys *   # List all keys
exit
```

---

## 🔍 **Troubleshooting Common Issues**

### **1. Poetry Not Found**

```powershell
# Add Poetry to PATH manually
$env:PATH += ";$env:APPDATA\Python\Scripts"
# Or restart terminal after Poetry installation
```

### **2. PostgreSQL Connection Issues**

```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# Start if not running
Start-Service postgresql-x64-16  # Adjust version number

# Test connection
psql -U postgres -h localhost -p 5432
```

### **3. Redis Connection Issues**

```powershell
# If using WSL Redis
wsl
sudo service redis-server status
sudo service redis-server start

# Test connection
redis-cli ping
```

### **4. Port Already in Use**

```powershell
# Find process using port
netstat -ano | findstr :8000
netstat -ano | findstr :8001
netstat -ano | findstr :3000

# Kill process if needed
taskkill /PID <PID_NUMBER> /F
```

### **5. Module Import Errors**

```powershell
# Reinstall dependencies
cd services\api
poetry install --no-cache

cd ..\auth
poetry install --no-cache

# For frontend
npm ci  # Clean install
```

---

## 📋 **Development Workflow**

### **1. Daily Development Startup**

```powershell
# 1. Start Redis (if using WSL)
wsl sudo service redis-server start

# 2. Start all services (from project root)
npm run dev:auth     # Terminal 1
npm run dev:api      # Terminal 2
npm run dev:client   # Terminal 3

# 3. Open development URLs
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
# Auth Docs: http://localhost:8001/docs
```

### **2. Git Workflow**

```powershell
# Check current branch
git branch

# Create feature branch
git checkout -b feature/your-feature-name

# Stage and commit changes
git add .
git commit -m "feat: your feature description"

# Push to remote
git push origin feature/your-feature-name
```

### **3. Database Schema Changes**

```powershell
# When modifying models
cd services\api
poetry shell

# Generate migration
alembic revision --autogenerate -m "description of changes"

# Apply migration
alembic upgrade head

# Update seed data if needed
python data/seed-scripts/seed_all.py
```

---

## 🎯 **Next Steps**

Your development environment is now ready! You can:

1. **Start Development**: Begin implementing the prioritized user stories from `docs/MVP_USER_STORY_PRIORITIES.md`
2. **Test API Endpoints**: Use the auto-generated docs at `http://localhost:8000/docs`
3. **Develop Frontend**: Create metadata-driven pages using the existing component system
4. **Database Development**: Add new entities and migrations as needed

---

## 📚 **Useful Commands Reference**

```powershell
# Project Management
npm run dev:auth              # Start auth service
npm run dev:api               # Start API service
npm run dev:client            # Start frontend
npm run build                 # Build all packages
npm run test                  # Run all tests

# Database
psql -U erp_user -d metadata_erp_master    # Connect to master DB
alembic upgrade head                       # Apply migrations
alembic revision --autogenerate           # Generate migration

# Python Development
poetry install                # Install dependencies
poetry shell                  # Activate virtual environment
poetry add package-name       # Add new dependency
poetry show                   # List installed packages

# Git
git status                    # Check working directory
git checkout -b feature/name  # Create feature branch
git commit -m "message"       # Commit changes
git push origin branch-name   # Push to remote
```

---

_Your laptop is now fully configured for developing the metadata-driven legal practice CRM + ERP platform! 🚀_
