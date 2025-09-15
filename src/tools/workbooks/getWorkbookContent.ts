import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Server } from '../../server.js';
import { convertBinaryToBase64TextResult } from '../convertBinaryToBase64TextResult.js';
import { Tool } from '../tool.js';

const paramsSchema = {
  workbookId: z.string(),
};

export const getWorkbookContentTool = (server: Server): Tool<typeof paramsSchema> => {
  const tool = new Tool({
    server,
    name: 'get-workbook-content',
    description:
      'Returns the workbook content (TWB) in XML format without extracts. Useful for parsing calculated fields and other workbook elements.',
    paramsSchema,
    annotations: {
      title: 'Get Workbook Content',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async ({ workbookId }, { requestId }): Promise<CallToolResult> => {
      const config = getConfig();

      return await tool.logAndExecute({
        requestId,
        args: { workbookId },
        callback: async () => {
          return new Ok(
            await useRestApi({
              config,
              requestId,
              server,
              jwtScopes: ['tableau:content:read'],
              callback: async (restApi) => {
                // Get workbook name for filename hint
                const workbook = await restApi.workbooksMethods.getWorkbook({
                  workbookId,
                  siteId: restApi.siteId,
                });

                // Get the workbook content as XML (TWB) without extract
                const binary = await restApi.workbooksMethods.downloadWorkbookContent({
                  workbookId,
                  siteId: restApi.siteId,
                  includeExtract: false, // Get XML format
                });

                // Set filename and MIME type for XML content
                const filenameBase = workbook.name || workbookId;
                const filename = `${filenameBase}.twb`;
                const mimeType = 'application/xml';

                return { binary, filename, mimeType } as const;
              },
            }),
          );
        },
        getSuccessResult: (result) =>
          convertBinaryToBase64TextResult({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: (result as any).binary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            filename: (result as any).filename,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mimeType: (result as any).mimeType,
          }),
      });
    },
  });

  return tool;
};
