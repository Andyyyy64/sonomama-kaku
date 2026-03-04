import { BrowserWindow, screen } from 'electron';
import * as path from 'path';

let overlayWindow: BrowserWindow | null = null;

export function isOverlayOpen(): boolean {
  return overlayWindow !== null && !overlayWindow.isDestroyed();
}

export function createOverlayWindow(screenshotDataUrl: string): BrowserWindow {
  if (isOverlayOpen()) {
    overlayWindow!.focus();
    return overlayWindow!;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;

  overlayWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  if (process.platform === 'win32') {
    overlayWindow.setSimpleFullScreen(true);
  } else {
    overlayWindow.setFullScreen(true);
  }

  overlayWindow.loadFile(
    path.join(__dirname, '..', 'renderer', 'overlay.html')
  );

  overlayWindow.webContents.on('did-finish-load', () => {
    overlayWindow?.webContents.send('set-screenshot', screenshotDataUrl);
  });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  return overlayWindow;
}

export function closeOverlay(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
    overlayWindow = null;
  }
}
