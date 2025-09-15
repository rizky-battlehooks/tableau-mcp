import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export function convertBinaryToBase64TextResult(params: {
  data: string;
  filename: string;
  mimeType?: string;
}): CallToolResult {
  const base64Data = Buffer.from(params.data).toString('base64');
  const payload = {
    filename: params.filename,
    mimeType: params.mimeType ?? 'application/octet-stream',
    encoding: 'base64',
    data: base64Data,
  };

  return {
    isError: false,
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload),
      },
    ],
  };
}
