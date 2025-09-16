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

const workbookId = '308c6a80-75af-4637-9051-2782062b327c';

describe('list-workbook-calculated-fields minimalFields option', () => {
  it('significantly reduces payload size with minimalFields=true', async () => {
    const server = new Server();
    const tool = getListWorkbookCalculatedFieldsTool(server);
    const requestId = 'test-request-id';

    // Test with normal fields (all properties)
    const normalArgs = {
      workbookId,
      source: 'twb-xml' as const,
      fieldsLimit: 100,
      omitFormulas: true,
      minimalFields: false,
    };

    const normalResult = await tool.callback(normalArgs as any, { requestId } as any);
    expect(normalResult.isError).toBe(false);
    const normalBody = JSON.parse((normalResult.content?.[0] as any).text);
    const normalPayload = JSON.stringify(normalBody);

    // Test with minimal fields (only name, datatype, role)
    const minimalArgs = {
      workbookId,
      source: 'twb-xml' as const,
      fieldsLimit: 100,
      omitFormulas: true,
      minimalFields: true,
    };

    const minimalResult = await tool.callback(minimalArgs as any, { requestId } as any);
    expect(minimalResult.isError).toBe(false);
    const minimalBody = JSON.parse((minimalResult.content?.[0] as any).text);
    const minimalPayload = JSON.stringify(minimalBody);

    // Verify both have the same number of fields
    expect(normalBody.count).toBe(minimalBody.count);
    expect(normalBody.count).toBeGreaterThan(0);

    // Verify payload size reduction
    const reduction = (normalPayload.length - minimalPayload.length) / normalPayload.length;
    console.log(`Normal payload size: ${normalPayload.length} characters`);
    console.log(`Minimal payload size: ${minimalPayload.length} characters`);
    console.log(`Payload size reduction: ${(reduction * 100).toFixed(1)}%`);

    // Should have significant reduction (at least 50%)
    expect(reduction).toBeGreaterThan(0.5);

    // Verify minimal fields only have essential properties
    const sampleMinimalField = minimalBody.fields[0];
    expect(Object.keys(sampleMinimalField)).toEqual(['name', 'datatype', 'role']);
    expect(sampleMinimalField.name).toBeDefined();
    expect(sampleMinimalField.datatype).toBeDefined();
    expect(sampleMinimalField.role).toBeDefined();

    // Verify normal fields have more properties
    const sampleNormalField = normalBody.fields[0];
    expect(Object.keys(sampleNormalField).length).toBeGreaterThan(3);
  });
});
