const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Building Sky Engine Windows Wallpaper App ===\n');

// 1. Build React web application
console.log('[1/4] Building Vite + React production bundle...');
execSync('npm run build', { stdio: 'inherit' });

// 2. Compile C# Win32 helper if needed
console.log('\n[2/4] Verifying native Win32 wallpaper helper...');
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
const csSource = path.join(__dirname, '../electron/WallpaperHelper.cs');
const helperExe = path.join(__dirname, '../electron/wallpaper-helper.exe');

if (fs.existsSync(cscPath) && fs.existsSync(csSource)) {
  execSync(`"${cscPath}" /nologo /optimize /target:exe /out:"${helperExe}" "${csSource}"`, { stdio: 'inherit' });
  console.log('Compiled wallpaper-helper.exe successfully.');
}

// 3. Prepare release directory
console.log('\n[3/4] Packaging standalone Electron executable...');
const releaseDir = path.join(__dirname, '../build/SkyWallpaper-win-x64');
if (fs.existsSync(releaseDir)) {
  fs.rmSync(releaseDir, { recursive: true, force: true });
}
fs.mkdirSync(releaseDir, { recursive: true });

// Copy Electron binary distribution
const electronDist = path.join(__dirname, '../node_modules/electron/dist');
if (!fs.existsSync(electronDist)) {
  console.error('ERROR: node_modules/electron/dist not found!');
  process.exit(1);
}

// Recursive copy helper
function copyRecursiveSync(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) => {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(electronDist, releaseDir);

// Rename electron.exe to SkyWallpaper.exe
const origExe = path.join(releaseDir, 'electron.exe');
const targetExe = path.join(releaseDir, 'SkyWallpaper.exe');
if (fs.existsSync(origExe)) {
  fs.renameSync(origExe, targetExe);
  console.log('Created SkyWallpaper.exe');
}

// 4. Create resources/app bundle
console.log('\n[4/4] Bundling application assets into resources/app...');
const appDir = path.join(releaseDir, 'resources/app');
fs.mkdirSync(appDir, { recursive: true });

// Minimal package.json for Electron
const appPkg = {
  name: 'sky-engine-wallpaper',
  version: '1.0.0',
  main: 'electron/main.cjs'
};
fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(appPkg, null, 2));

// Copy dist/
copyRecursiveSync(path.join(__dirname, '../dist'), path.join(appDir, 'dist'));

// Copy electron/
copyRecursiveSync(path.join(__dirname, '../electron'), path.join(appDir, 'electron'));

console.log('\n======================================================');
console.log(' SUCCESS! Standalone Windows Wallpaper Executable Built:');
console.log(` ${targetExe}`);
console.log('======================================================\n');
