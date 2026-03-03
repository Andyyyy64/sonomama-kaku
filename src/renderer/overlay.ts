declare global {
  interface Window {
    electronAPI: {
      onSetScreenshot: (callback: (dataUrl: string) => void) => void;
      closeOverlay: () => void;
      saveImage: (dataUrl: string) => Promise<boolean>;
    };
  }
}

const screenshotCanvas = document.getElementById('screenshot-canvas') as HTMLCanvasElement;
const drawingCanvas = document.getElementById('drawing-canvas') as HTMLCanvasElement;
const screenshotCtx = screenshotCanvas.getContext('2d')!;
const drawingCtx = drawingCanvas.getContext('2d')!;

const colorPicker = document.getElementById('color-picker') as HTMLInputElement;
const brushSize = document.getElementById('brush-size') as HTMLInputElement;
const brushSizeLabel = document.getElementById('brush-size-label') as HTMLSpanElement;
const eraserBtn = document.getElementById('eraser-btn') as HTMLButtonElement;
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
const closeBtn = document.getElementById('close-btn') as HTMLButtonElement;

let isDrawing = false;
let isEraser = false;
let lastX = 0;
let lastY = 0;

// Canvas を画面サイズに合わせる
function resizeCanvases(width: number, height: number): void {
  screenshotCanvas.width = width;
  screenshotCanvas.height = height;
  drawingCanvas.width = width;
  drawingCanvas.height = height;
}

// スクショ受信
window.electronAPI.onSetScreenshot((dataUrl: string) => {
  const img = new Image();
  img.onload = () => {
    resizeCanvases(img.width, img.height);
    screenshotCtx.drawImage(img, 0, 0);
  };
  img.src = dataUrl;
});

// 描画設定
function applyDrawSettings(): void {
  drawingCtx.lineWidth = parseInt(brushSize.value, 10);
  drawingCtx.lineCap = 'round';
  drawingCtx.lineJoin = 'round';

  if (isEraser) {
    drawingCtx.globalCompositeOperation = 'destination-out';
    drawingCtx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    drawingCtx.globalCompositeOperation = 'source-over';
    drawingCtx.strokeStyle = colorPicker.value;
  }
}

// 座標取得（CSS座標 → Canvas座標 の変換）
function getCanvasCoords(e: PointerEvent): { x: number; y: number } {
  const rect = drawingCanvas.getBoundingClientRect();
  const scaleX = drawingCanvas.width / rect.width;
  const scaleY = drawingCanvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

// ポインタイベント
drawingCanvas.addEventListener('pointerdown', (e: PointerEvent) => {
  // ツールバー上のクリックは無視
  if ((e.target as HTMLElement).closest('#toolbar')) return;

  isDrawing = true;
  const { x, y } = getCanvasCoords(e);
  lastX = x;
  lastY = y;

  applyDrawSettings();
  drawingCtx.beginPath();
  drawingCtx.moveTo(x, y);
  drawingCanvas.setPointerCapture(e.pointerId);
});

drawingCanvas.addEventListener('pointermove', (e: PointerEvent) => {
  if (!isDrawing) return;

  const { x, y } = getCanvasCoords(e);
  applyDrawSettings();
  drawingCtx.beginPath();
  drawingCtx.moveTo(lastX, lastY);
  drawingCtx.lineTo(x, y);
  drawingCtx.stroke();

  lastX = x;
  lastY = y;
});

drawingCanvas.addEventListener('pointerup', () => {
  isDrawing = false;
});

drawingCanvas.addEventListener('pointerleave', () => {
  isDrawing = false;
});

// ブラシサイズ表示更新
brushSize.addEventListener('input', () => {
  brushSizeLabel.textContent = `${brushSize.value}px`;
});

// 消しゴムトグル
eraserBtn.addEventListener('click', () => {
  isEraser = !isEraser;
  eraserBtn.classList.toggle('active', isEraser);
});

// 保存: 2つのCanvasを合成
saveBtn.addEventListener('click', async () => {
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = screenshotCanvas.width;
  mergedCanvas.height = screenshotCanvas.height;
  const mergedCtx = mergedCanvas.getContext('2d')!;
  mergedCtx.drawImage(screenshotCanvas, 0, 0);
  mergedCtx.drawImage(drawingCanvas, 0, 0);

  const dataUrl = mergedCanvas.toDataURL('image/png');
  await window.electronAPI.saveImage(dataUrl);
});

// 閉じる
closeBtn.addEventListener('click', () => {
  window.electronAPI.closeOverlay();
});

// Escキーで閉じる
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    window.electronAPI.closeOverlay();
  }
});

export {};
