/**
 * Overlay script injected into the sandbox iframe's srcdoc.
 * Reports element clicks to the parent window via postMessage.
 *
 * Bundled as a string at build time; do NOT import from anywhere except
 * the runtime's iframe HTML builder.
 */

export const OVERLAY_SCRIPT = `(function() {
  'use strict';
  let hovered = null;

  function getXPath(el) {
    if (el.dataset && el.dataset.codesignId) return '[data-codesign-id="' + el.dataset.codesignId + '"]';
    if (el.id) return '#' + el.id;
    const parts = [];
    while (el && el.nodeType === 1 && el !== document.body) {
      let idx = 1;
      let sib = el.previousElementSibling;
      while (sib) { if (sib.tagName === el.tagName) idx++; sib = sib.previousElementSibling; }
      parts.unshift(el.tagName.toLowerCase() + '[' + idx + ']');
      el = el.parentElement;
    }
    return '/' + parts.join('/');
  }

  document.addEventListener('mouseover', function(e) {
    if (hovered) hovered.style.outline = '';
    hovered = e.target;
    if (hovered) hovered.style.outline = '2px solid #c96442';
  }, true);

  document.addEventListener('mouseout', function() {
    if (hovered) hovered.style.outline = '';
    hovered = null;
  }, true);

  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    const el = e.target;
    const rect = el.getBoundingClientRect();
    window.parent.postMessage({
      __codesign: true,
      type: 'ELEMENT_SELECTED',
      selector: getXPath(el),
      tag: el.tagName.toLowerCase(),
      outerHTML: (el.outerHTML || '').slice(0, 800),
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
    }, '*');
  }, true);
})();`;

export interface OverlayMessage {
  __codesign: true;
  type: 'ELEMENT_SELECTED';
  selector: string;
  tag: string;
  outerHTML: string;
  rect: { top: number; left: number; width: number; height: number };
}

export function isOverlayMessage(data: unknown): data is OverlayMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { __codesign?: boolean }).__codesign === true &&
    (data as { type?: string }).type === 'ELEMENT_SELECTED'
  );
}
