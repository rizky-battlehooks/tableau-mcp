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

export const getDownloadWorkbookTool = (server: Server): Tool<typeof paramsSchema> => {
  const downloadWorkbookTool = new Tool({
    server,
    name: 'download-workbook',
    description:
      'Downloads the workbook content (TWB/TWBX) by workbook ID and returns a base64-encoded payload with filename and mimeType.',
    paramsSchema,
    annotations: {
      title: 'Download Workbook',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async ({ workbookId }, { requestId }): Promise<CallToolResult> => {
      const config = getConfig();

      return await downloadWorkbookTool.logAndExecute({
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

                // Get the workbook content - explicitly request XML format (TWB) without extract
                const binary = await restApi.workbooksMethods.downloadWorkbookContent({
                  workbookId,
                  siteId: restApi.siteId,
                  includeExtract: false, // Explicitly set to false to get XML format
                });

                // Since we're explicitly requesting XML format (TWB) without extract,
                // we can set the filename and mimeType directly
                const filenameBase = workbook.name || workbookId;
                const filename = `${filenameBase}.twb`;
                const mimeType = 'application/xml';

                return { binary, filename, mimeType } as const;
              },
            })
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

  return downloadWorkbookTool;
};
