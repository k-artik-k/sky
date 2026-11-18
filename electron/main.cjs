const {
  app,
  BrowserWindow,
  screen,
  Tray,
  Menu,
  globalShortcut,
  nativeImage,
  shell,
  ipcMain,
} = require("electron");
const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");

// Disable DirectComposition and GPU compositing swapchain deadlocks when parenting to Windows 11 WorkerW
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("disable-direct-composition");

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let tray = null;
const isDev = process.argv.includes("--dev");

function getHwnd(win) {
  const buf = win.getNativeWindowHandle();
  return process.arch === "x64"
    ? buf.readBigInt64LE().toString()
    : buf.readInt32LE().toString();
}

function attachWindow(win, bounds) {
  if (!win || win.isDestroyed()) return;

  const hwnd = getHwnd(win);
  const helperExe = path.join(__dirname, "wallpaper-helper.exe");

  const x = bounds.x;
  const y = bounds.y;
  const w = bounds.width;
  const h = bounds.height;

  if (fs.existsSync(helperExe)) {
    // ASYNCHRONOUS: Do NOT block the Electron event loop!
    execFile(
      helperExe,
      ["attach", hwnd, String(x), String(y), String(w), String(h)],
      (err, stdout, stderr) => {
        if (err) {
          console.error("[WALLPAPER ATTACH ERROR]", err, stderr);
          // Fallback to PowerShell
          attachViaPowerShell(hwnd, x, y, w, h);
        } else {
          console.log("[WALLPAPER HELPER]", stdout.trim());
        }
      }
    );
    return;
  }

  // Fallback if helper binary is missing
  attachViaPowerShell(hwnd, x, y, w, h);
}

function attachViaPowerShell(hwnd, x, y, w, h) {
  const psScript = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WpHack {
    [DllImport("user32.dll")] public static extern IntPtr FindWindow(string c, string w);
    [DllImport("user32.dll")] public static extern IntPtr FindWindowEx(IntPtr p, IntPtr a, string c, string w);
    [DllImport("user32.dll")] public static extern IntPtr SendMessageTimeout(IntPtr h, uint m, IntPtr w, IntPtr l, uint f, uint u, out IntPtr r);
    [DllImport("user32.dll")] public static extern IntPtr SetParent(IntPtr c, IntPtr p);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int cx, int cy, uint u);
    [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr h, int n);
    [DllImport("user32.dll")] public static extern int SetWindowLong(IntPtr h, int n, int d);
    public delegate bool EnumProc(IntPtr h, IntPtr l);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc e, IntPtr l);
    public static void Attach(long hwndVal, int x, int y, int w, int h) {
        IntPtr p = FindWindow("Progman", null);
        IntPtr r;
        SendMessageTimeout(p, 0x052C, new IntPtr(0xD), new IntPtr(0x1), 0, 1000, out r);
        IntPtr target = IntPtr.Zero;
        EnumWindows((hWnd, lParam) => {
            if (FindWindowEx(hWnd, IntPtr.Zero, "SHELLDLL_DefView", null) != IntPtr.Zero) {
                target = FindWindowEx(IntPtr.Zero, hWnd, "WorkerW", null);
            }
            return true;
        }, IntPtr.Zero);
        if (target == IntPtr.Zero) target = p;

        IntPtr ch = new IntPtr(hwndVal);
        int style = GetWindowLong(ch, -16);
        style = (style & ~unchecked((int)0x80000000)) | 0x40000000 | 0x10000000;
        SetWindowLong(ch, -16, style);

        int exStyle = GetWindowLong(ch, -20);
        exStyle |= 0x00000080;
        SetWindowLong(ch, -20, exStyle);

        SetParent(ch, target);
        SetWindowPos(ch, IntPtr.Zero, x, y, w, h, 0x0074);
    }
}
"@;
[WpHack]::Attach(${hwnd}, ${x}, ${y}, ${w}, ${h})
`;

  execFile("powershell", ["-NoProfile", "-NonInteractive", "-Command", psScript], (err) => {
    if (err) console.error("[POWERSHELL FALLBACK ERROR]", err);
    else console.log("[POWERSHELL FALLBACK] Successfully attached to desktop");
  });
}

function createWallpaperWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const bounds = primaryDisplay.bounds;

  mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    show: false,
    transparent: false,
    backgroundColor: "#8fcff6",
    skipTaskbar: true,
    focusable: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false, // Keep animations running at 60 FPS in background
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  // Load content
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    const indexPath = path.join(__dirname, "../dist/index.html");
    mainWindow.loadFile(indexPath);
  }

  // Intercept any navigation to external links so wallpaper stays clean
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Handle IPC open-external requests from Spotlight
  ipcMain.on("wallpaper:open-external", (_event, url) => {
    shell.openExternal(url);
  });

  // Gracefully attach after initial paint
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    // Short delay to let D3D renderer initialize before parenting
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        attachWindow(mainWindow, bounds);
      }
    }, 200);
  });

  // Handle display changes
  screen.on("display-metrics-changed", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const newBounds = screen.getPrimaryDisplay().bounds;
      mainWindow.setBounds(newBounds);
      attachWindow(mainWindow, newBounds);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "tray-icon.png");
  let trayIcon;
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip("Sky Engine - Windows 11 Live Wallpaper");

  const buildMenu = () => {
    const autoLaunch = app.getLoginItemSettings().openAtLogin;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "⛅ Sky Engine (Live Wallpaper)",
        enabled: false,
      },
      { type: "separator" },
      {
        label: "Open Appearance Settings",
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("wallpaper:open-settings");
          }
        },
      },
      {
        label: "Command Spotlight (Ctrl+Shift+Space)",
        click: () => {
          triggerSpotlight();
        },
      },
      {
        label: "Toggle Center Clock",
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("wallpaper:toggle-clock");
          }
        },
      },
      { type: "separator" },
      {
        label: "Launch on Windows Startup",
        type: "checkbox",
        checked: autoLaunch,
        click: (item) => {
          app.setLoginItemSettings({
            openAtLogin: item.checked,
            path: process.execPath,
            args: [path.join(__dirname, "main.cjs")],
          });
        },
      },
      {
        label: "Reload Wallpaper",
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.reload();
            setTimeout(() => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                attachWindow(mainWindow, screen.getPrimaryDisplay().bounds);
              }
            }, 500);
          }
        },
      },
      { type: "separator" },
      {
        label: "Exit Live Wallpaper",
        click: () => {
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
  };

  buildMenu();

  tray.on("double-click", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("wallpaper:open-settings");
    }
  });
}

function triggerSpotlight() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    mainWindow.webContents.send("wallpaper:open-spotlight");
  }
}

app.whenReady().then(() => {
  createWallpaperWindow();
  createTray();

  globalShortcut.register("CommandOrControl+Shift+Space", () => {
    triggerSpotlight();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  if (mainWindow && !mainWindow.isDestroyed()) {
    const helperExe = path.join(__dirname, "wallpaper-helper.exe");
    if (fs.existsSync(helperExe)) {
      try {
        execFile(helperExe, ["detach", getHwnd(mainWindow)]);
      } catch {}
    }
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
