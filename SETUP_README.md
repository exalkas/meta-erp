# 🚀 Quick Setup Guide - Legal Practice CRM + ERP Platform

**Get your laptop ready for development in 2 minutes with Docker!**

---

## 🐳 **Recommended: Docker Setup (Super Easy)**

**Install only 1 thing and you're done!**

### **Prerequisites**

1. **Docker Desktop** - https://www.docker.com/products/docker-desktop/

### **Setup**

```bash
# One command to start everything
npm run docker:dev
```

**That's it!** 🎉 Access your platform at http://localhost:3000

👉 **[Full Docker Guide](DOCKER_SETUP.md)** for complete instructions

### **Why Docker?**

| Aspect               | Docker Setup    | Manual Setup           |
| -------------------- | --------------- | ---------------------- |
| **Prerequisites**    | 1 tool (Docker) | 5+ tools               |
| **Setup Time**       | 2 minutes       | 30+ minutes            |
| **Troubleshooting**  | Minimal         | Common issues          |
| **Consistency**      | Same everywhere | Environment variations |
| **New Team Members** | 2 minutes       | 30+ minutes setup      |

---

## 📋 **Alternative: Manual Setup**

If you prefer manual installation, you'll need these on Windows 11:

1. **Node.js 18+** - https://nodejs.org/download/
2. **Python 3.11+** - https://python.org/downloads/
3. **PostgreSQL 16+** - https://postgresql.org/download/windows/
4. **Poetry** - https://install.python-poetry.org/
5. **Redis** - Install via WSL: `wsl --install` then `sudo apt install redis-server`

---

## ⚡ **Manual Setup (If Not Using Docker)**

### **Option 1: One-Command Setup**

```powershell
# Run this single command from project root
npm run setup:laptop
```

### **Option 2: Manual Setup**

```powershell
# 1. Install dependencies
npm install

# 2. Set up Python environments
cd services/auth && poetry install && cd ../..
cd services/api && poetry install && cd ../..

# 3. Create environment files (manual - see guide below)
# 4. Set up database (manual - see guide below)
```

---

## 🔍 **Verify Everything Works**

```powershell
# Check if everything is set up correctly
npm run verify:setup
```

This will check:

- ✅ All prerequisites installed
- ✅ Database connections working
- ✅ Environment files created
- ✅ Dependencies installed

---

## 🎯 **Start Development**

### **Start All Services**

```powershell
# Terminal 1: Auth Service (Port 8001)
npm run dev:auth

# Terminal 2: API Service (Port 8000)
npm run dev:api

# Terminal 3: Frontend (Port 3000)
npm run dev:client
```

### **Access Your Platform**

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Auth Documentation**: http://localhost:8001/docs

---

## 🗄️ **Database Commands**

```powershell
# Apply database migrations
npm run db:migrate

# Seed initial data (users, roles, tenants)
npm run db:seed

# Reset database (migrate + seed)
npm run db:reset
```

---

## 🔧 **Manual Setup (If Automated Fails)**

### **1. Create Environment Files**

**services/auth/.env**:

```env
DATABASE_URL=postgresql://erp_user:@localhost:5432/metadata_erp_master
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-super-secret-jwt-key-here
SECRET_KEY=your-super-secret-key-here
ENVIRONMENT=development
DEBUG=true
PORT=8001
```

**services/api/.env**:

```env
DATABASE_URL=postgresql://erp_user:@localhost:5432/metadata_erp_master
REDIS_URL=redis://localhost:6379/1
AUTH_SERVICE_URL=http://localhost:8001
ENVIRONMENT=development
DEBUG=true
PORT=8000
```

**apps/client/.env.local**:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AUTH_URL=http://localhost:8001
NODE_ENV=development
NEXT_PUBLIC_DEFAULT_TENANT_ID=demo-eshop-crm
```

### **2. Set Up Database**

```sql
-- Connect to PostgreSQL as postgres user
psql -U postgres

-- Create databases
CREATE DATABASE metadata_erp_master;
CREATE DATABASE metadata_erp_tenant_demo;

-- Create user
CREATE USER erp_user WITH PASSWORD '';
GRANT ALL PRIVILEGES ON DATABASE metadata_erp_master TO erp_user;
GRANT ALL PRIVILEGES ON DATABASE metadata_erp_tenant_demo TO erp_user;
```

---

## 🛠️ **Development Workflow**

### **Daily Startup**

```powershell
# 1. Start Redis (if using WSL)
wsl sudo service redis-server start

# 2. Verify everything is working
npm run verify:setup

# 3. Start development services
npm run dev:auth     # Terminal 1
npm run dev:api      # Terminal 2
npm run dev:client   # Terminal 3
```

### **Making Changes**

```powershell
# For database schema changes
cd services/api
poetry shell
alembic revision --autogenerate -m "your change description"
alembic upgrade head

# For frontend package changes
npm run build:shared-ui

# For testing
npm run test
npm run lint
```

---

## 📚 **Key Development URLs**

| Service       | URL                        | Purpose                       |
| ------------- | -------------------------- | ----------------------------- |
| **Frontend**  | http://localhost:3000      | Main application UI           |
| **API Docs**  | http://localhost:8000/docs | Interactive API documentation |
| **Auth Docs** | http://localhost:8001/docs | Authentication API docs       |
| **Database**  | localhost:5432             | PostgreSQL (use pgAdmin)      |
| **Redis**     | localhost:6379             | Cache and sessions            |

---

## 🐛 **Troubleshooting**

### **Common Issues**

**Poetry not found:**

```powershell
# Add to PATH and restart terminal
$env:PATH += ";$env:APPDATA\Python\Scripts"
```

**PostgreSQL connection failed:**

```powershell
# Check if service is running
Get-Service postgresql*
Start-Service postgresql-x64-16
```

**Redis not accessible:**

```powershell
# If using WSL
wsl sudo service redis-server start
redis-cli ping  # Should return PONG
```

**Port already in use:**

```powershell
# Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
```

### **Reset Everything**

```powershell
# Clean install dependencies
npm ci
cd services/auth && poetry install --no-cache && cd ../..
cd services/api && poetry install --no-cache && cd ../..

# Reset database
npm run db:reset

# Verify setup
npm run verify:setup
```

---

## 📋 **What's Included After Setup**

✅ **Multi-tenant architecture** with demo tenant  
✅ **User authentication** with JWT tokens  
✅ **Role-based access control** with default roles  
✅ **Metadata-driven UI** with dynamic forms  
✅ **Database migrations** with Alembic  
✅ **Seed data** with demo users and content  
✅ **Development hot reload** for all services  
✅ **API documentation** with Swagger UI

---

## 🎯 **Next Steps**

1. **Explore the Platform**: Open http://localhost:3000 and log in
2. **Check API Docs**: Visit http://localhost:8000/docs to see available endpoints
3. **Start Development**: Begin implementing user stories from `docs/MVP_USER_STORY_PRIORITIES.md`
4. **Read the Guides**:
   - Full setup guide: `docs/LAPTOP_SETUP_GUIDE.md`
   - User stories: `docs/LEGAL_SERVICES_USER_STORIES.md`
   - MVP priorities: `docs/MVP_USER_STORY_PRIORITIES.md`

---

## 💡 **Quick Commands Reference**

### **Docker Commands (Recommended)**

```bash
# Development
npm run docker:dev          # Start everything with logs
npm run docker:up           # Start in background
npm run docker:down         # Stop all services
npm run docker:logs         # View logs
npm run docker:status       # Check service status

# Management
npm run docker:build        # Rebuild containers
npm run docker:clean        # Reset everything
```

### **Manual Setup Commands**

```powershell
# Setup & Verification
npm run setup:laptop        # Automated setup
npm run verify:setup        # Check everything works

# Development
npm run dev:auth            # Start auth service
npm run dev:api             # Start API service
npm run dev:client          # Start frontend

# Database
npm run db:migrate          # Apply migrations
npm run db:seed             # Seed data
npm run db:reset            # Reset database

# Building & Testing
npm run build               # Build all packages
npm run test                # Run all tests
npm run lint                # Lint all code
```

---

**🎉 You're ready to build the future of legal practice management!**

### **Need Help?**

- **Docker Setup**: [DOCKER_SETUP.md](DOCKER_SETUP.md) (Recommended)
- **Manual Setup**: [docs/LAPTOP_SETUP_GUIDE.md](docs/LAPTOP_SETUP_GUIDE.md)
- **Already set up manually?** You can switch to Docker anytime - just run `npm run docker:dev`
