# 🐳 Docker Setup Guide - Legal Practice CRM + ERP Platform

**Get your entire development environment running in 2 minutes!**

---

## 🎯 **Why Docker?**

Docker setup is **dramatically simpler** than manual installation:

### **Manual Setup** ❌

- Install Node.js 18+
- Install Python 3.11+
- Install PostgreSQL 16+
- Install Poetry
- Install Redis (via WSL)
- Configure environment files
- Set up databases
- Install dependencies
- **Total time: ~30 minutes + troubleshooting**

### **Docker Setup** ✅

- Install Docker Desktop
- Run one command
- **Total time: ~2 minutes**

---

## 📋 **Prerequisites**

Only need **1 thing**:

1. **Docker Desktop** - https://www.docker.com/products/docker-desktop/

That's it! Docker includes everything else.

---

## ⚡ **Quick Setup (Super Easy)**

### **Option 1: One-Command Development**

```bash
# Start everything with live reloading
npm run docker:dev
```

### **Option 2: Background Services**

```bash
# Start everything in background
npm run docker:setup

# View logs
npm run docker:logs
```

### **Option 3: Manual Docker Compose**

```bash
# Build and start all services
docker-compose up --build
```

---

## 🔍 **Verify Everything Works**

```bash
# Check all services are running
npm run docker:status

# Should show all services as "Up"
```

**Access your platform:**

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Auth Documentation**: http://localhost:8001/docs

---

## 🎯 **What's Included**

Docker automatically sets up:

✅ **PostgreSQL 16** - Database with automatic initialization  
✅ **Redis 7** - Caching and session storage  
✅ **Auth Service** - JWT authentication (Port 8001)  
✅ **API Service** - Main backend APIs (Port 8000)  
✅ **Frontend** - Next.js application (Port 3000)  
✅ **Database migrations** - Automatic on startup  
✅ **Seed data** - Demo users, roles, tenants  
✅ **Health checks** - Ensures services are ready  
✅ **Volume persistence** - Data survives container restarts

---

## 🛠️ **Docker Commands**

### **Development Commands**

```bash
# Start development environment (with logs)
npm run docker:dev

# Start in background
npm run docker:up

# Stop all services
npm run docker:down

# Restart services
npm run docker:restart

# View real-time logs
npm run docker:logs
```

### **Management Commands**

```bash
# Check service status
npm run docker:status

# Rebuild containers (after code changes)
npm run docker:build

# Clean everything (reset to fresh state)
npm run docker:clean
```

### **Advanced Docker Commands**

```bash
# Start specific service
docker-compose up postgres redis

# Execute commands in containers
docker-compose exec api-service python data/seed-scripts/seed_all.py
docker-compose exec postgres psql -U postgres metadata_erp_master

# View container logs
docker-compose logs auth-service
docker-compose logs api-service
docker-compose logs client
```

---

## 🔧 **Development Workflow**

### **Daily Development**

```bash
# 1. Start everything
npm run docker:dev

# 2. Open your IDE and start coding
# All changes are live-reloaded automatically!

# 3. Access the platform
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### **Making Changes**

```bash
# Code changes are automatically detected and reloaded

# For database schema changes
docker-compose exec api-service alembic revision --autogenerate -m "your change"
docker-compose exec api-service alembic upgrade head

# For dependency changes, rebuild
npm run docker:build
```

### **Database Operations**

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres metadata_erp_master

# Re-seed database
docker-compose exec api-service python data/seed-scripts/seed_all.py

# View database
docker-compose exec postgres psql -U erp_user metadata_erp_master -c "SELECT * FROM tenants;"
```

---

## 📊 **Container Architecture**

| Container        | Purpose             | Port | Dependencies          |
| ---------------- | ------------------- | ---- | --------------------- |
| **postgres**     | PostgreSQL database | 5432 | None                  |
| **redis**        | Cache & sessions    | 6379 | None                  |
| **auth-service** | Authentication API  | 8001 | postgres, redis       |
| **api-service**  | Main business API   | 8000 | postgres, redis, auth |
| **client**       | Next.js frontend    | 3000 | api-service           |

---

## 🐛 **Troubleshooting**

### **Container Won't Start**

```bash
# Check logs for specific service
docker-compose logs auth-service
docker-compose logs api-service

# Check all service status
npm run docker:status
```

### **Port Already in Use**

```bash
# Stop all Docker containers
docker stop $(docker ps -aq)

# Or specifically stop this project
npm run docker:down
```

### **Database Issues**

```bash
# Reset entire database
npm run docker:clean
npm run docker:setup
```

### **Code Changes Not Reflected**

```bash
# Rebuild containers
npm run docker:build

# For frontend changes, might need to clear cache
docker-compose restart client
```

### **Complete Reset**

```bash
# Nuclear option - delete everything and start fresh
npm run docker:clean
npm run docker:setup
```

---

## 🔍 **Health Checks**

Docker automatically monitors service health:

```bash
# View health status
docker-compose ps

# Healthy services show "Up (healthy)"
# Unhealthy services show "Up (unhealthy)"
```

Each service has health checks:

- **postgres**: `pg_isready`
- **redis**: `redis-cli ping`
- **auth-service**: `curl http://localhost:8001/health`
- **api-service**: `curl http://localhost:8000/health`
- **client**: `curl http://localhost:3000`

---

## 💾 **Data Persistence**

Docker volumes preserve your data:

- **postgres_data**: Database files
- **redis_data**: Cache data
- **api_uploads**: File uploads
- **node_modules**: Node.js dependencies
- **next_cache**: Next.js build cache

Data survives container restarts unless you run `npm run docker:clean`.

---

## 🚀 **Production Considerations**

For production deployment:

1. **Environment Variables**: Update secrets in `docker-compose.yml`
2. **Database**: Use external PostgreSQL service
3. **Redis**: Use external Redis service
4. **Load Balancer**: Add nginx reverse proxy
5. **SSL**: Configure HTTPS certificates
6. **Monitoring**: Add logging and monitoring services

---

## 💡 **Docker vs Manual Setup Comparison**

| Aspect            | Docker Setup          | Manual Setup              |
| ----------------- | --------------------- | ------------------------- |
| **Prerequisites** | Docker Desktop only   | 5+ tools to install       |
| **Setup Time**    | 2 minutes             | 30+ minutes               |
| **Consistency**   | Same everywhere       | Environment variations    |
| **Isolation**     | Complete isolation    | Potential conflicts       |
| **Cleanup**       | One command reset     | Manual cleanup needed     |
| **Onboarding**    | New devs: 2 minutes   | New devs: 30+ minutes     |
| **Dependencies**  | Handled automatically | Manual version management |

---

## 🎯 **Next Steps**

1. **Start Development**: `npm run docker:dev`
2. **Access Platform**: http://localhost:3000
3. **Explore APIs**: http://localhost:8000/docs
4. **Read User Stories**: `docs/MVP_USER_STORY_PRIORITIES.md`
5. **Start Building**: Begin with metadata-driven components

---

**🎉 Docker setup complete! You now have a full enterprise-grade development environment running in containers!**

**Much easier than manual setup, right?** 🐳✨
