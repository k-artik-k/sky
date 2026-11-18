/// <reference types="vite/client" />

interface Window {
  electronWallpaper?: {
    isWallpaper: boolean;
    openExternal: (url: string) => void;
    onOpenSettings: (callback: () => void) => void;
    onToggleClock: (callback: () => void) => void;
    onOpenSpotlight: (callback: () => void) => void;
    onPauseToggle?: (callback: () => void) => void;
  };
}
