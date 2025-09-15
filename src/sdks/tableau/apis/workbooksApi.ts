import { makeApi, makeEndpoint, ZodiosEndpointDefinitions } from '@zodios/core';
import { z } from 'zod';

import { paginationSchema } from '../types/pagination.js';
import { workbookSchema } from '../types/workbook.js';
import { paginationParameters } from './paginationParameters.js';

const getWorkbookEndpoint = makeEndpoint({
  method: 'get',
  path: `/sites/:siteId/workbooks/:workbookId`,
  alias: 'getWorkbook',
  description:
    'Returns information about the specified workbook, including information about views and tags.',
  response: z.object({ workbook: workbookSchema }),
});

const downloadWorkbookContentEndpoint = makeEndpoint({
  method: 'get',
  path: `/sites/:siteId/workbooks/:workbookId/content`,
  alias: 'downloadWorkbookContent',
  description:
    'Downloads the specified workbook content as a TWB or TWBX file depending on whether it has extracts.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'workbookId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'includeExtract',
      type: 'Query',
      schema: z.boolean().optional(),
      description:
        'If false, the workbook is returned without extracts (TWB). If true (default), includes extracts (TWBX when applicable).',
    },
  ],
  // Accept binary payload; the actual Axios responseType is set at call time
  response: z.any(),
});

const queryWorkbooksForSiteEndpoint = makeEndpoint({
  method: 'get',
  path: `/sites/:siteId/workbooks`,
  alias: 'queryWorkbooksForSite',
  description: 'Returns the workbooks on a site.',
  parameters: [
    ...paginationParameters,
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'filter',
      type: 'Query',
      schema: z.string().optional(),
      description:
        'An expression that lets you specify a subset of workbooks to return. You can filter on predefined fields such as name, tags, and createdAt. You can include multiple filter expressions.',
    },
  ],
  response: z.object({
    pagination: paginationSchema,
    workbooks: z.object({
      workbook: z.optional(z.array(workbookSchema)),
    }),
  }),
});

const workbooksApi = makeApi([
  queryWorkbooksForSiteEndpoint,
  getWorkbookEndpoint,
  downloadWorkbookContentEndpoint,
]);

export const workbooksApis = [...workbooksApi] as const satisfies ZodiosEndpointDefinitions;
