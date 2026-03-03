import { app, dialog, globalShortcut, ipcMain } from 'electron';
import * as fs from 'fs';
import { createTray } from './tray';
import { captureScreen } from './capturer';
import { createOverlayWindow, closeOverlay, isOverlayOpen } from './overlay-window';

async function activateOverlay(): Promise<void> {
  if (isOverlayOpen()) return;

  try {
    const screenshot = await captureScreen();
    createOverlayWindow(screenshot);
  } catch (err) {
    dialog.showErrorBox('sonomama-kaku', `スクリーンキャプチャに失敗しました:\n${err}`);
  }
}

app.whenReady().then(() => {
  createTray(() => {
    activateOverlay();
  });

  globalShortcut.register('Ctrl+Shift+A', () => {
    activateOverlay();
  });

  ipcMain.on('close-overlay', () => {
    closeOverlay();
  });

  ipcMain.handle('save-image', async (_event, dataUrl: string): Promise<boolean> => {
    const result = await dialog.showSaveDialog({
      defaultPath: `sonomama-kaku-${Date.now()}.png`,
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
    });

    if (result.canceled || !result.filePath) return false;

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(result.filePath, Buffer.from(base64Data, 'base64'));
    return true;
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Keep running when all windows closed (tray app)
app.on('window-all-closed', () => {
  // Do not quit - app lives in tray
});
