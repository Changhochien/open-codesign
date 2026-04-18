import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from '@open-codesign/core';
import { detectProviderFromKey } from '@open-codesign/providers';
import type { ChatMessage, ModelRef } from '@open-codesign/shared';
import { BrowserWindow, app, ipcMain, shell } from 'electron';
import { autoUpdater } from 'electron-updater';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#faf8f3',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => mainWindow?.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle('codesign:detect-provider', (_e, key: string) => detectProviderFromKey(key));

  ipcMain.handle(
    'codesign:generate',
    async (
      _e,
      payload: {
        prompt: string;
        history: ChatMessage[];
        model: ModelRef;
        apiKey: string;
        baseUrl?: string;
      },
    ) => {
      const { prompt, history, model, apiKey, baseUrl } = payload;
      return generate({
        prompt,
        history,
        model,
        apiKey,
        ...(baseUrl !== undefined ? { baseUrl } : {}),
      });
    },
  );
}

function setupAutoUpdater(): void {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = false;
  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('codesign:update-available', info);
  });
  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('codesign:update-error', err.message);
  });
  ipcMain.handle('codesign:check-for-updates', () => autoUpdater.checkForUpdates());
  ipcMain.handle('codesign:download-update', () => autoUpdater.downloadUpdate());
  ipcMain.handle('codesign:install-update', () => autoUpdater.quitAndInstall());
}

void app.whenReady().then(() => {
  registerIpcHandlers();
  setupAutoUpdater();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
