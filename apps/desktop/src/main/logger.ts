import { existsSync, renameSync, unlinkSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import log from 'electron-log/main';
import { app } from './electron-runtime';
import { currentRunId } from './runContext';
import { getActiveStorageLocations } from './storage-settings';

/**
 * Centralized logger for the main + preload + renderer processes.
 *
 * Files:
 *   macOS:   ~/Library/Logs/open-codesign/main.log
 *   Windows: %APPDATA%/open-codesign/logs/main.log
 *   Linux:   ~/.config/open-codesign/logs/main.log
 *
 * Console mirror: WARN+ in dev, ERROR only in prod, off when packaged-quiet.
 * Format example:
 *   [2026-04-18 12:34:56.789] [info] [main:onboarding] save-key provider=openai
 *
 * Surface in UI: Settings → Storage → "Open log folder" (TODO).
 */

let initialized = false;

export function defaultLogsDir(): string {
  return app.getPath('logs');
}

export function logsDir(): string {
  return getActiveStorageLocations().logsDir ?? defaultLogsDir();
}

export function initLogger(): typeof log {
  if (initialized) return log;
  initialized = true;

  log.transports.file.resolvePathFn = () => getLogPath();
  log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
  log.transports.file.archiveLogFn = (oldFile: { path: string } | string) => {
    const p = typeof oldFile === 'string' ? oldFile : oldFile.path;
    rotateLogFile(p, { existsSync, renameSync, unlinkSync });
  };
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {scope} {text}';
  log.transports.console.level = app.isPackaged ? 'warn' : 'info';
  log.transports.console.format = '[{level}] {scope} {text}';

  log.errorHandler.startCatching({
    showDialog: false,
    onError: ({ error, processType }: { error: Error; processType?: string }) => {
      log.error(`[crash:${processType ?? 'main'}]`, error);
    },
  });

  log.eventLogger.startLogging({
    events: {
      app: { ready: true, 'window-all-closed': true },
      webContents: {},
    },
  });

  log.scope.labelPadding = false;
  log.info('[boot] open-codesign starting', {
    version: app.getVersion(),
    platform: process.platform,
    electron: process.versions.electron,
    node: process.versions.node,
  });

  return log;
}

export interface ScopedLogger {
  info: (event: string, data?: Record<string, unknown>) => void;
  warn: (event: string, data?: Record<string, unknown>) => void;
  error: (event: string, data?: Record<string, unknown>) => void;
}

export function getLogger(scope: string): ScopedLogger {
  const scoped = log.scope(scope);
  const wrap =
    (level: 'info' | 'warn' | 'error') => (event: string, data?: Record<string, unknown>) => {
      const runId = currentRunId();
      const merged = runId !== undefined ? { runId, ...(data ?? {}) } : data;
      if (merged === undefined) {
        scoped[level](event);
      } else {
        scoped[level](event, merged);
      }
    };
  return { info: wrap('info'), warn: wrap('warn'), error: wrap('error') };
}

export function getLogPath(): string {
  return join(logsDir(), 'main.log');
}

/**
 * Rotation policy for main.log: on overflow, keep up to 2 previous files.
 *   main.log       -> main.old.log
 *   main.old.log   -> main.old.1.log (if main.old.log exists before rotate)
 *   main.old.1.log -> discarded
 *
 * Synchronous so electron-log v5's archive callback can complete
 * before the next write.
 */
export function rotateLogFile(
  activePath: string,
  fs: {
    existsSync: (p: string) => boolean;
    renameSync: (a: string, b: string) => void;
    unlinkSync: (p: string) => void;
  },
): void {
  const dir = dirname(activePath);
  const base = basename(activePath);
  const stem = base.replace(/\.log$/, '');
  const old = join(dir, `${stem}.old.log`);
  const oldest = join(dir, `${stem}.old.1.log`);
  if (fs.existsSync(oldest)) fs.unlinkSync(oldest);
  if (fs.existsSync(old)) fs.renameSync(old, oldest);
  if (fs.existsSync(activePath)) fs.renameSync(activePath, old);
}
