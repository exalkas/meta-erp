# 🎨 Theme Variant System - Quick Reference

## 🎯 Overview

**Enterprise theme system** with marketplace-ready themes and light/dark variants.

## 📊 Database Structure

```
BaseTheme (maritime, corporate, modern)
├── ThemeVariant (light, dark)
│   └── ThemeVariantProperty (CSS custom properties)
└── Marketplace metadata (creator, price, ratings)
```

## 🚀 API Quick Reference

### Get Theme Variants

```bash
# Get default variant (usually light)
GET /api/themes/maritime

# Get specific variant
GET /api/themes/maritime/dark
GET /api/themes/maritime/light

# Response format:
{
  "base_theme": {
    "name": "maritime",
    "display_name": "Maritime Professional Theme",
    "version": "1.0.0"
  },
  "variant": {
    "variant_name": "dark",
    "display_name": "Dark Mode",
    "css_class_prefix": "dark"
  },
  "css_properties": {
    "--primary-color": "#4A9EFF",
    "--background-color": "#1A1A1A",
    "--text-color": "#FFFFFF"
  }
}
```

## 💻 Frontend Usage

### Theme Context Hook

```typescript
const { selectedTheme, selectedVariant, toggleDarkMode } = useThemeVariant();

// Current state
console.log(selectedTheme); // "maritime"
console.log(selectedVariant); // "dark"

// Toggle between light/dark
toggleDarkMode();
```

### Theme Toggle Component

```tsx
const ThemeToggle = () => {
  const { selectedVariant, toggleDarkMode } = useThemeVariant();

  return (
    <button onClick={toggleDarkMode}>
      {selectedVariant === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
};
```

### Manual Theme Selection

```typescript
const { setTheme, setVariant } = useThemeVariant();

// Change base theme
setTheme("corporate");

// Change variant
setVariant("dark");
```

## 🗄️ Database Queries

### Get All Themes

```sql
SELECT
  bt.name,
  bt.display_name,
  COUNT(tv.variant_id) as variant_count
FROM base_themes bt
LEFT JOIN theme_variants tv ON bt.base_theme_id = tv.base_theme_id
WHERE bt.is_active = true
GROUP BY bt.base_theme_id, bt.name, bt.display_name;
```

### Get Theme with Variants

```sql
SELECT
  bt.name as theme_name,
  tv.variant_name,
  tv.display_name as variant_display_name,
  tv.css_class_prefix
FROM base_themes bt
JOIN theme_variants tv ON bt.base_theme_id = tv.base_theme_id
WHERE bt.name = 'maritime' AND bt.is_active = true;
```

### Get CSS Properties for Variant

```sql
SELECT
  tvp.property_key,
  tvp.property_value,
  tvp.category
FROM base_themes bt
JOIN theme_variants tv ON bt.base_theme_id = tv.base_theme_id
JOIN theme_variant_properties tvp ON tv.variant_id = tvp.variant_id
WHERE bt.name = 'maritime' AND tv.variant_name = 'dark';
```

## 🎨 CSS Generation

### Auto-generated CSS Output

```css
/* Light mode (default) */
:root {
  --primary-color: #0066cc;
  --background-color: #ffffff;
  --text-color: #1a1a1a;
}

/* Dark mode */
.dark {
  --primary-color: #4a9eff;
  --background-color: #1a1a1a;
  --text-color: #ffffff;
}

/* Auto-switching based on system preference */
@media (prefers-color-scheme: dark) {
  :root {
    --primary-color: #4a9eff;
    --background-color: #1a1a1a;
    --text-color: #ffffff;
  }
}
```

### Using CSS Properties in Components

```tsx
const Button = () => (
  <button
    style={{
      backgroundColor: "var(--primary-color)",
      color: "var(--text-color)",
      borderColor: "var(--border-color)",
    }}
  >
    Click me
  </button>
);

// Or with Tailwind (using CSS variables)
const Button = () => (
  <button className="bg-[var(--primary-color)] text-[var(--text-color)]">
    Click me
  </button>
);
```

## 🛠️ Development Workflow

### 1. Create New Theme

```sql
-- 1. Create base theme
INSERT INTO base_themes (name, display_name, category)
VALUES ('corporate', 'Corporate Theme', 'business');

-- 2. Create light variant
INSERT INTO theme_variants (base_theme_id, variant_name, display_name, is_default)
VALUES ('base-theme-uuid', 'light', 'Light Mode', true);

-- 3. Create dark variant
INSERT INTO theme_variants (base_theme_id, variant_name, display_name, css_class_prefix)
VALUES ('base-theme-uuid', 'dark', 'Dark Mode', 'dark');

-- 4. Add CSS properties
INSERT INTO theme_variant_properties (variant_id, property_key, property_value, category)
VALUES
  ('light-variant-uuid', '--primary-color', '#2563EB', 'colors'),
  ('dark-variant-uuid', '--primary-color', '#60A5FA', 'colors');
```

### 2. Test Theme Variant

```bash
# Test API endpoint
curl http://localhost:8000/api/themes/corporate/dark

# Expected: CSS properties for corporate dark theme
```

### 3. Update Frontend

```typescript
// Add theme to selection list
const AVAILABLE_THEMES = [
  { name: "maritime", display: "Maritime Theme" },
  { name: "corporate", display: "Corporate Theme" }, // New theme
];
```

## 🎯 Common Patterns

### Theme Selection Dropdown

```tsx
const ThemeSelector = () => {
  const { selectedTheme, setTheme } = useThemeVariant();

  return (
    <select value={selectedTheme} onChange={(e) => setTheme(e.target.value)}>
      <option value="maritime">Maritime Theme</option>
      <option value="corporate">Corporate Theme</option>
      <option value="modern">Modern Theme</option>
    </select>
  );
};
```

### System Auto-Detection

```typescript
useEffect(() => {
  // Detect system preference
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  setVariant(mediaQuery.matches ? "dark" : "light");

  // Listen for changes
  const handler = (e) => setVariant(e.matches ? "dark" : "light");
  mediaQuery.addEventListener("change", handler);

  return () => mediaQuery.removeEventListener("change", handler);
}, []);
```

### Tenant-Specific Themes

```sql
-- Create tenant-specific theme override
INSERT INTO base_themes (tenant_id, name, display_name)
VALUES ('tenant-uuid', 'custom-maritime', 'Custom Maritime Theme');

-- Override specific properties
INSERT INTO theme_variant_properties (variant_id, property_key, property_value)
VALUES ('variant-uuid', '--primary-color', '#FF6B35');  -- Tenant brand color
```

## 🚀 Performance Tips

1. **Cache CSS Properties**: Store in Redis for faster access
2. **Lazy Load Variants**: Only load when needed
3. **CSS Custom Properties**: More performant than inline styles
4. **System Preference**: Use CSS media queries when possible

## 🔧 Troubleshooting

### Theme Not Loading

- Check API endpoint returns valid JSON
- Verify theme name and variant exist in database
- Check console for CSS property application errors

### CSS Not Applying

- Ensure CSS custom properties are set on `:root`
- Check CSS selector specificity
- Verify Tailwind configuration includes CSS variables

### Performance Issues

- Enable Redis caching for theme data
- Use CSS-only variant switching when possible
- Minimize JavaScript theme switching operations
