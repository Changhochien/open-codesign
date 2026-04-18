/**
 * Exporter entry point — each format lives in its own subpath export and
 * MUST be imported via dynamic import() to keep the cold-start bundle lean.
 *
 * Tier 1: not implemented yet. Stub re-exports so the desktop app can wire
 * the menu items that surface "coming soon" UI.
 */

export const EXPORTER_FORMATS = ['html', 'pdf', 'pptx', 'zip'] as const;
export type ExporterFormat = (typeof EXPORTER_FORMATS)[number];

export interface ExportOptions {
  artifactId: string;
  destinationPath: string;
}

export interface ExportResult {
  bytes: number;
  path: string;
}

export function isExporterReady(format: ExporterFormat): boolean {
  return format === 'html';
}

/**
 * Export a single HTML artifact to disk. Tier 1: writes the raw HTML.
 * Tier 2 will inline external assets, embed fonts, run optimization.
 */
export async function exportHtml(
  htmlContent: string,
  destinationPath: string,
): Promise<ExportResult> {
  const fs = await import('node:fs/promises');
  await fs.writeFile(destinationPath, htmlContent, 'utf8');
  const stat = await fs.stat(destinationPath);
  return { bytes: stat.size, path: destinationPath };
}
