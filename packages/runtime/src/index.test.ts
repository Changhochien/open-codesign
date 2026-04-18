import { describe, expect, it } from 'vitest';
import { buildSrcdoc } from './index';

describe('buildSrcdoc', () => {
  it('wraps a fragment in a full document', () => {
    const out = buildSrcdoc('<div>hi</div>');
    expect(out).toContain('<!doctype html>');
    expect(out).toContain('<div>hi</div>');
    expect(out).toContain('ELEMENT_SELECTED');
  });

  it('injects overlay before </body> in a full document', () => {
    const html = '<html><body><p>x</p></body></html>';
    const out = buildSrcdoc(html);
    expect(out).toContain('<p>x</p>');
    expect(out.indexOf('ELEMENT_SELECTED')).toBeLessThan(out.indexOf('</body>'));
  });

  it('strips CSP meta tags', () => {
    const html =
      '<html><head><meta http-equiv="Content-Security-Policy" content="default-src none"></head><body></body></html>';
    const out = buildSrcdoc(html);
    expect(out).not.toContain('Content-Security-Policy');
  });
});
