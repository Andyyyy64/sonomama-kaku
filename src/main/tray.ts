import { Tray, nativeImage } from 'electron';
import * as path from 'path';

let tray: Tray | null = null;

export function createTray(onClick: () => void): Tray {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip('sonomama-kaku');
  tray.on('click', onClick);

  return tray;
}
