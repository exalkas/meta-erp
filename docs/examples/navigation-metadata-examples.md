# 🧭 Navigation Component Metadata Examples

**Complete examples for configuring Navigation components via database metadata**

---

## 📋 **Basic Navigation Structure**

```json
{
  "type": "Navigation",
  "props": {
    "variant": "horizontal",
    "showUserMenu": true,
    "showThemeSelector": true,
    "showLanguageSelector": true,
    "userMenuStyle": "buttons",
    "adminMode": true,
    "user": {
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "Platform Administrator"
    },
    "userMenu": [...],
    "items": [...]
  }
}
```

---

## 🎯 **User Menu Configurations**

### **Individual Buttons Style (userMenuStyle: "buttons")**

Perfect for admin dashboards and professional interfaces:

```json
{
  "userMenuStyle": "buttons",
  "userMenu": [
    {
      "id": "user-profile",
      "label": "Profile",
      "action": "navigate:/profile",
      "icon": "User"
    },
    {
      "id": "user-settings",
      "label": "Settings",
      "action": "navigate:/settings",
      "icon": "Settings"
    },
    {
      "id": "user-preferences",
      "label": "Preferences",
      "action": "navigate:/preferences",
      "icon": "Sliders"
    },
    {
      "id": "logout",
      "label": "Logout",
      "action": "logout",
      "icon": "LogOut"
    }
  ]
}
```

**Renders as:** `🏠 Dashboard | ⚙️ App Builder | 🌙 Theme | 🌐 EN ▼ | 👤 Profile | ⚙️ Settings | 🎛️ Preferences | 🚪 Logout | 👨‍💼 Admin User`

### **Dropdown Menu Style (userMenuStyle: "dropdown")**

Compact design for space-constrained interfaces:

```json
{
  "userMenuStyle": "dropdown",
  "userMenu": [
    {
      "id": "user-account",
      "label": "Account Settings",
      "action": "navigate:/account",
      "icon": "User"
    },
    {
      "id": "billing",
      "label": "Billing",
      "action": "navigate:/billing",
      "icon": "CreditCard"
    },
    {
      "id": "logout",
      "label": "Sign Out",
      "action": "logout",
      "icon": "LogOut"
    }
  ]
}
```

**Renders as:** `🏠 Dashboard | ⚙️ App Builder | 🌙 Theme | 🌐 EN ▼ | 👨‍💼 Admin User ▼`

---

## 🎨 **Theme and Language Integration**

### **Full Theme Support**

```json
{
  "showThemeSelector": true,
  "showLanguageSelector": true,
  "props": {
    "themeOptions": ["light", "dark", "maritime"],
    "languageOptions": ["en", "el", "de"],
    "defaultTheme": "maritime",
    "defaultLanguage": "en"
  }
}
```

### **Minimal Navigation (No Extras)**

For clean, focused interfaces:

```json
{
  "showThemeSelector": false,
  "showLanguageSelector": false,
  "showUserMenu": false,
  "items": [
    { "id": "home", "label": "Home", "route": "/", "icon": "Home" },
    { "id": "about", "label": "About", "route": "/about", "icon": "Info" }
  ]
}
```

---

## ⚡ **Action Types**

### **Navigation Actions**

```json
{
  "action": "navigate:/dashboard", // Route navigation
  "action": "navigate:/settings?tab=profile", // Navigation with query params
  "action": "navigate:https://external.com" // External URL (opens new tab)
}
```

### **System Actions**

```json
{
  "action": "logout", // Calls auth service logout
  "action": "refresh", // Refreshes current page
  "action": "modal:confirm-logout" // Opens confirmation modal
}
```

### **Custom Actions**

```json
{
  "action": "custom:export-data", // Triggers custom handler
  "action": "api:users/refresh", // Direct API call
  "action": "workflow:start-backup" // Triggers workflow
}
```

---

## 📱 **Responsive Examples**

### **Mobile-Optimized Navigation**

```json
{
  "variant": "horizontal",
  "mobileBreakpoint": "md",
  "userMenuStyle": "dropdown", // Saves space on mobile
  "items": [
    { "id": "dashboard", "label": "Dashboard", "icon": "Home", "active": true },
    { "id": "search", "label": "Search", "icon": "Search" },
    { "id": "notifications", "label": "Notifications", "icon": "Bell" }
  ],
  "userMenu": [
    {
      "id": "profile",
      "label": "Profile",
      "action": "navigate:/profile",
      "icon": "User"
    },
    { "id": "logout", "label": "Logout", "action": "logout", "icon": "LogOut" }
  ]
}
```

### **Desktop-Optimized Navigation**

```json
{
  "variant": "horizontal",
  "userMenuStyle": "buttons", // Full buttons on desktop
  "items": [
    {
      "id": "dashboard",
      "label": "Dashboard",
      "route": "/dashboard",
      "icon": "LayoutDashboard"
    },
    {
      "id": "analytics",
      "label": "Analytics",
      "route": "/analytics",
      "icon": "BarChart"
    },
    {
      "id": "users",
      "label": "User Management",
      "route": "/users",
      "icon": "Users"
    },
    {
      "id": "settings",
      "label": "System Settings",
      "route": "/settings",
      "icon": "Settings"
    }
  ]
}
```

---

## 🏢 **Role-Based Examples**

### **Admin Navigation**

```json
{
  "adminMode": true,
  "userMenuStyle": "buttons",
  "showThemeSelector": true,
  "userMenu": [
    {
      "id": "admin-panel",
      "label": "Admin Panel",
      "action": "navigate:/admin",
      "icon": "Shield"
    },
    {
      "id": "system-logs",
      "label": "System Logs",
      "action": "navigate:/logs",
      "icon": "FileText"
    },
    {
      "id": "user-management",
      "label": "Users",
      "action": "navigate:/admin/users",
      "icon": "Users"
    },
    { "id": "logout", "label": "Logout", "action": "logout", "icon": "LogOut" }
  ]
}
```

### **Regular User Navigation**

```json
{
  "adminMode": false,
  "userMenuStyle": "dropdown",
  "showThemeSelector": true,
  "userMenu": [
    {
      "id": "my-profile",
      "label": "My Profile",
      "action": "navigate:/profile",
      "icon": "User"
    },
    {
      "id": "account-settings",
      "label": "Account",
      "action": "navigate:/account",
      "icon": "Settings"
    },
    {
      "id": "help",
      "label": "Help & Support",
      "action": "navigate:/help",
      "icon": "HelpCircle"
    },
    {
      "id": "logout",
      "label": "Sign Out",
      "action": "logout",
      "icon": "LogOut"
    }
  ]
}
```

---

## 🎯 **Real-World Complete Example**

**Admin Dashboard Navigation (as used in the platform):**

```json
{
  "type": "Navigation",
  "props": {
    "variant": "horizontal",
    "showUserMenu": true,
    "showThemeSelector": true,
    "showLanguageSelector": true,
    "showNotifications": true,
    "userMenuStyle": "buttons",
    "adminMode": true,
    "background": "professional",
    "sticky": true,
    "user": {
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "Platform Administrator"
    },
    "userMenu": [
      {
        "id": "user-profile",
        "label": "Profile",
        "action": "navigate:/profile",
        "icon": "User"
      },
      {
        "id": "user-settings",
        "label": "Settings",
        "action": "navigate:/settings",
        "icon": "Settings"
      },
      {
        "id": "user-preferences",
        "label": "Preferences",
        "action": "navigate:/preferences",
        "icon": "Sliders"
      },
      {
        "id": "logout",
        "label": "Logout",
        "action": "logout",
        "icon": "LogOut"
      }
    ],
    "items": [
      {
        "id": "nav-dashboard",
        "label": "Dashboard",
        "route": "/dashboard",
        "icon": "LayoutDashboard",
        "active": true
      },
      {
        "id": "nav-app-builder",
        "label": "App Builder",
        "route": "/app-builder",
        "icon": "Wrench",
        "badge": "New"
      },
      {
        "id": "nav-platform",
        "label": "Platform",
        "route": "/platform",
        "icon": "Settings"
      },
      {
        "id": "nav-users",
        "label": "Users",
        "route": "/users",
        "icon": "Users"
      }
    ]
  }
}
```

**Result:** Full-featured admin navigation with individual user menu buttons, theme switching, and complete metadata control.

---

## 🔧 **Implementation Notes**

### **Action Handlers**

Actions are processed by `DynamicComponent` with these behaviors:

- **`logout`** → Calls `authLogout()` from `useAuth` hook → Redirects to `/login`
- **`navigate:/path`** → Uses Next.js router to navigate to internal routes
- **`navigate:https://...`** → Opens external URLs in new tab
- **`custom:action`** → Triggers custom action handlers in `contextProps.onAction`

### **Icon System**

All icons use the `iconMapper` utility with Lucide React:

- **Supported icons:** Any Lucide React icon name (e.g., "User", "Settings", "LogOut")
- **Fallback behavior:** Unknown icons display as text with warning icon
- **Responsive sizing:** Icons automatically sized for context (navbar, mobile, etc.)

### **Metadata Updates**

Navigation changes are applied via:

1. **Update JSON:** Modify `data/metadata/pages/admin-dashboard-page.json`
2. **Run Seeding:** `poetry run python ../../data/seed-scripts/seed_all.py`
3. **Refresh Frontend:** Changes appear immediately on page refresh

**No code changes required** - everything controlled via database metadata! 🎉
