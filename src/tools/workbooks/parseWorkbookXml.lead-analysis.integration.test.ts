import { parseWorkbookXml } from './parseWorkbookXml.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// This test parses the real Tableau TWB workbook and snapshots the extracted calculated fields.
// On first run, Vitest will create a snapshot. Subsequent runs will validate against it.

describe('parseWorkbookXml - Lead Analysis.twb (real workbook)', () => {
  it('parses real workbook and matches snapshot', () => {
    const twbPath = join(process.cwd(), 'Lead Analysis.twb');
    const xmlContent = readFileSync(twbPath, 'utf8');

    const result = parseWorkbookXml(xmlContent);

    // Snapshot the full result. If you want a smaller snapshot, you can map to a subset of fields.
    expect(result).toMatchSnapshot();
  });
});
