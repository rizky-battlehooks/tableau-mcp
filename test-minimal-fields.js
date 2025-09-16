import { readFileSync } from 'fs';
import { join } from 'path';

// Test to compare payload sizes with and without minimalFields
async function testPayloadSizes() {
  const { getListWorkbookCalculatedFieldsTool } = await import('./build/tools/workbooks/listWorkbookCalculatedFields.js');
  const { Server } = await import('./build/server.js');

  // Mock useRestApi to use local TWB file
  const mockUseRestApi = async ({ callback }) => {
    const restApi = {
      siteId: 'test-site',
      workbooksMethods: {
        getWorkbook: () => Promise.resolve({
          id: '308c6a80-75af-4637-9051-2782062b327c',
          name: 'Lead Analysis',
        }),
        downloadWorkbookContent: async () => {
          const twbPath = join(process.cwd(), 'Lead Analysis.twb');
          return readFileSync(twbPath, 'utf8');
        },
      },
      metadataMethods: {
        graphql: () => Promise.resolve({ data: { workbooks: [] } }),
      },
    };
    return callback(restApi);
  };

  // Override the module
  const originalModule = await import('./build/restApiInstance.js');
  originalModule.useRestApi = mockUseRestApi;

  const server = new Server();
  const tool = getListWorkbookCalculatedFieldsTool(server);

  console.log('Testing payload sizes...\n');

  // Test 1: Normal fields (with all properties)
  const normalResult = await tool.callback({
    workbookId: '308c6a80-75af-4637-9051-2782062b327c',
    source: 'twb-xml',
    fieldsLimit: 100,
    omitFormulas: true,
    minimalFields: false,
  }, { requestId: 'test-1' });

  const normalPayload = JSON.stringify(normalResult.content[0].text);
  console.log(`Normal fields payload size: ${normalPayload.length} characters`);

  // Test 2: Minimal fields (only name, datatype, role)
  const minimalResult = await tool.callback({
    workbookId: '308c6a80-75af-4637-9051-2782062b327c',
    source: 'twb-xml',
    fieldsLimit: 100,
    omitFormulas: true,
    minimalFields: true,
  }, { requestId: 'test-2' });

  const minimalPayload = JSON.stringify(minimalResult.content[0].text);
  console.log(`Minimal fields payload size: ${minimalPayload.length} characters`);

  const reduction = ((normalPayload.length - minimalPayload.length) / normalPayload.length * 100).toFixed(1);
  console.log(`\nPayload size reduction: ${reduction}%`);

  // Show sample field structure
  const normalData = JSON.parse(normalResult.content[0].text);
  const minimalData = JSON.parse(minimalResult.content[0].text);

  console.log('\nSample normal field:');
  console.log(JSON.stringify(normalData.fields[0], null, 2));

  console.log('\nSample minimal field:');
  console.log(JSON.stringify(minimalData.fields[0], null, 2));
}

testPayloadSizes().catch(console.error);
