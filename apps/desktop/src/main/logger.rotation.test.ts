import { describe, expect, it, vi } from 'vitest';
import { rotateLogFile } from './logger';

describe('rotateLogFile', () => {
  it('shifts main.log -> main.old.log when no old exists', () => {
    const fs = {
      existsSync: vi.fn((p: string) => p.endsWith('main.log')),
      renameSync: vi.fn(),
      unlinkSync: vi.fn(),
    };
    rotateLogFile('/tmp/logs/main.log', fs);
    expect(fs.renameSync).toHaveBeenCalledWith('/tmp/logs/main.log', '/tmp/logs/main.old.log');
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  it('shifts both slots when main.log and main.old.log exist', () => {
    const exists = new Set(['/tmp/logs/main.log', '/tmp/logs/main.old.log']);
    const fs = {
      existsSync: vi.fn((p: string) => exists.has(p)),
      renameSync: vi.fn(),
      unlinkSync: vi.fn(),
    };
    rotateLogFile('/tmp/logs/main.log', fs);
    expect(fs.renameSync).toHaveBeenNthCalledWith(
      1,
      '/tmp/logs/main.old.log',
      '/tmp/logs/main.old.1.log',
    );
    expect(fs.renameSync).toHaveBeenNthCalledWith(
      2,
      '/tmp/logs/main.log',
      '/tmp/logs/main.old.log',
    );
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  it('drops oldest when all three slots exist', () => {
    const exists = new Set([
      '/tmp/logs/main.log',
      '/tmp/logs/main.old.log',
      '/tmp/logs/main.old.1.log',
    ]);
    const fs = {
      existsSync: vi.fn((p: string) => exists.has(p)),
      renameSync: vi.fn(),
      unlinkSync: vi.fn(),
    };
    rotateLogFile('/tmp/logs/main.log', fs);
    expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/logs/main.old.1.log');
    expect(fs.renameSync).toHaveBeenCalledTimes(2);
  });

  it('is a no-op when the active file does not yet exist', () => {
    const fs = {
      existsSync: vi.fn(() => false),
      renameSync: vi.fn(),
      unlinkSync: vi.fn(),
    };
    rotateLogFile('/tmp/logs/main.log', fs);
    expect(fs.renameSync).not.toHaveBeenCalled();
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
});
