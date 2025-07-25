const fs = require("fs");
const path = require("path");

// Simple script to copy shared assets to each app's public folder
const apps = [
  "client",
  "marketing",
  "admin",
  "setup",
  "user-support",
  "staff-support",
];
const assetsDir = path.join(__dirname, "src");
const rootDir = path.join(__dirname, "../../");

// Function to copy all files from source to destination
function copyAssets(sourceDir, destDir) {
  const files = fs.readdirSync(sourceDir);

  files.forEach((file) => {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);

    // Skip index.js file - only copy asset files
    if (file === "index.js") return;

    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`  ✓ ${file}`);
    } catch (error) {
      console.error(`  ✗ Failed to copy ${file}: ${error.message}`);
    }
  });
}

apps.forEach((appName) => {
  const appPublicDir = path.join(rootDir, "apps", appName, "public");

  // Create public directory if it doesn't exist
  if (!fs.existsSync(appPublicDir)) {
    fs.mkdirSync(appPublicDir, { recursive: true });
  }

  // Copy all assets
  console.log(`Copying assets to ${appName}:`);
  copyAssets(assetsDir, appPublicDir);
  console.log(`Assets ready for ${appName} at ${appPublicDir}\n`);
});

console.log("✅ All apps ready for assets!");
