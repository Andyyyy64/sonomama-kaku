import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onSetScreenshot: (callback: (dataUrl: string) => void) => {
    ipcRenderer.on('set-screenshot', (_event, dataUrl: string) => {
      callback(dataUrl);
    });
  },
  closeOverlay: () => {
    ipcRenderer.send('close-overlay');
  },
  saveImage: async (dataUrl: string): Promise<boolean> => {
    return ipcRenderer.invoke('save-image', dataUrl);
  },
});
