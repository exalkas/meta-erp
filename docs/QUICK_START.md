# ⚡ Quick Start - Development Workflow

**30-second guide to get coding immediately**

---

## 🌅 **Daily Morning Routine**

```powershell
# 1. Fresh backend start (Docker)
npm run morning

# 2. Start legal app development (Local)
npm run dev:legal

# 3. Open browser to http://localhost:3006
# 4. Login: admin@demo-eshop-crm.local / 
```

**Done!** Start coding your layout fixes! 🎯

---

## 🔧 **Common Commands**

| Task                  | Command                    | Purpose                |
| --------------------- | -------------------------- | ---------------------- |
| **Daily startup**     | `npm run morning`          | Fresh Docker backend   |
| **Quick start**       | `npm run start`            | Start existing backend |
| **Legal app**         | `npm run dev:legal`        | Frontend development   |
| **Shared components** | `npm run watch:shared-ui`  | Component development  |
| **Check backend**     | `npm run docker:status`    | Service health         |
| **Backend logs**      | `npm run docker:logs:auth` | Debug issues           |

---

## 🎯 **Ports Reference**

- **3006** - Legal App (frontend)
- **8001** - Auth Service (Docker)
- **8000** - API Service (Docker)
- **5432** - PostgreSQL (Docker)
- **6379** - Redis (Docker)

---

## 🚨 **If Something Breaks**

```powershell
# Reset everything
npm run docker:down
npm run docker:up

# Check what's running
npm run docker:status

# View logs
npm run docker:logs
```

---

**Ready to code! 🚀**
