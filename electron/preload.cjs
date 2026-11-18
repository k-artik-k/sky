const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronWallpaper", {
  isWallpaper: true,
  openExternal: (url) => {
    ipcRenderer.send("wallpaper:open-external", url);
  },
  onOpenSettings: (callback) => {
    ipcRenderer.on("wallpaper:open-settings", () => callback());
  },
  onToggleClock: (callback) => {
    ipcRenderer.on("wallpaper:toggle-clock", () => callback());
  },
  onOpenSpotlight: (callback) => {
    ipcRenderer.on("wallpaper:open-spotlight", () => callback());
  },
  onPauseToggle: (callback) => {
    ipcRenderer.on("wallpaper:toggle-pause", () => callback());
  },
});
