import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

import { Server } from '../../server.js';
import { getListWorkbookCalculatedFieldsTool } from './listWorkbookCalculatedFields.js';

// Mock useRestApi to feed the XML of the local TWB for the provided workbook ID
vi.mock('../../restApiInstance.js', () => {
  return {
    useRestApi: async ({ callback }: any) => {
      const restApi = {
        siteId: 'test-site',
        workbooksMethods: {
          getWorkbook: vi.fn().mockResolvedValue({
            id: '308c6a80-75af-4637-9051-2782062b327c',
            name: 'Lead Analysis',
          }),
          downloadWorkbookContent: vi.fn().mockImplementation(async () => {
            const twbPath = join(process.cwd(), 'Lead Analysis.twb');
            return readFileSync(twbPath, 'utf8');
          }),
        },
        metadataMethods: {
          graphql: vi.fn().mockResolvedValue({ data: { workbooks: [] } }),
        },
      };
      return callback(restApi);
    },
  };
});

// The workbookId requested by the user
const workbookId = '308c6a80-75af-4637-9051-2782062b327c';

describe('list-workbook-calculated-fields (twb-xml mode) against real Lead Analysis.twb', () => {
  it('returns parsed fields and a summary for the given workbook ID', async () => {
    const server = new Server();
    const tool = getListWorkbookCalculatedFieldsTool(server);

    const requestId = 'test-request-id';
    const args = {
      workbookId,
      source: 'twb-xml' as const,
      includeSummary: true,
      sampleLimit: 10,
    };

    const res = await tool.callback(args as any, { requestId } as any);

    expect(res.isError).toBe(false);
    const body = JSON.parse((res.content?.[0] as any).text);

    // Basic structure checks
    expect(body.source).toBe('twb-xml');
    expect(Array.isArray(body.fields)).toBe(true);
    expect(typeof body.count).toBe('number');
    expect(body.count).toBe(body.fields.length);

    // Expect the same count we saw when parsing Lead Analysis.twb directly
    // If this ever changes, it indicates workbook content changes or parser behavior changes
    expect(body.count).toBeGreaterThan(2000);
    expect(body.summary.totalCalculatedFields).toBe(body.count);

    // Summary sanity checks
    expect(body.summary.byDatatype).toBeTruthy();
    expect(body.summary.byRole).toBeTruthy();
    expect(Array.isArray(body.summary.sample)).toBe(true);
    expect(body.summary.sample.length).toBeLessThanOrEqual(10);
  });
});
